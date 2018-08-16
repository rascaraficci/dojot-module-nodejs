var TopicManager = require("../Kafka/TopicManager");
var Consumer = require("../Kafka/Consumer");
var Producer = require("../Kafka/Producer");
var defaultConfig = require("../Kafka/config");
var uuid = require("uuid");
var util = require("util");

const DefaultSubjects = {
  TENANCY: "dojot.tenancy",
  DEVICE_DATA: "device-data",
  DEVICES: "dojot.device-manager.devices",
};

class dojot {
  constructor(name) {
    this.topicManager = new TopicManager();
    this.eventCallbacks = {};
    this.tenants = [];
    this.subjects = [];
    this.topics = [];
    this.producerTopics = {};
    this.globalSubjects = [];

    this.instanceId = name + uuid.v4();

    let producer = JSON.parse(JSON.stringify(defaultConfig.kafka.producer));
    producer["client.id"] = this.instanceId;
    this.producer = new Producer(producer);
    this.producer.connect().then(() => {
      console.log(`Producer for module ${this.instanceId} is ready.`);
    });

    // This should only get new messages.
    let consumer = JSON.parse(JSON.stringify(defaultConfig.kafka.consumer));
    consumer["group.id"] = this.instanceId;
    this.createChannel(DefaultSubjects.TENANCY, "r", true, {consumer});

    let processNewTenantCbk = this._processNewTenant.bind(this);
    this.on(DefaultSubjects.TENANCY, "message", processNewTenantCbk);
  }

  /**
   * Process a new tenant.
   * Whenever a new tenant is detected, it will request all the topics for
   * current active subjects.
   * @param {string} tenant Management tenant.
   * @param {string} msg The message describing the new tenant.
   */
  _processNewTenant(tenant, msg) {
    console.log(`Received message in tenancy subject.`);
    console.log(`Tenant is: ${tenant}`);
    console.log(`Message is: ${util.inspect(msg, {depth: null})}`);

    let data;
    try {
      data = JSON.parse(msg);
    } catch (error) {
      console.log("Data is not a valid JSON. Bailing out.");
      console.log(`Error is: ${error}`);
      return;
    }

    // Perform some sanity checks here
    if (!("tenant" in data)) {
      console.log("Received message is invalid. Bailing out.");
      return;
    }
    if (this.tenants.indexOf(data.tenant) != -1) {
      console.log("This tenant was already registered. Bailing out.");
      return;
    }

    this.tenants.push(data.tenant);
    for (let subject of this.subjects) {
      this._bootstrapTenant(subject.subject, data.tenant, subject.mode);
    }
    this.emit("dojot.tenancy", "management", "new-tenant", data.tenant);
  }

  emit(subject, tenant, event, data) {
    console.log(`Emitting new event ${event} for subject ${subject}@${tenant}`);
    console.log(`Current callback mapping is: ${util.inspect(this.eventCallbacks, {depth: null})}`);
    // Sanity checks
    if (!(subject in this.eventCallbacks)) {
      console.log(`No one is listening to subject ${subject} events.`);
      return;
    }

    if (!(event in this.eventCallbacks[subject])) {
      console.log(`No one is listening to subject ${subject} ${event} events.`);
      return;
    }
    // Maybe we should use async.parallel or async.waterfall here?
    for (let callback of this.eventCallbacks[subject][event]) {
      callback(tenant, data);
    }

  }

  /**
   * Register a new callback to be invoked when something happens to a subject.
   * The callback must have the following signature:
   * - (tenant: string, data: string): void
   * @param {string} subject
   * @param {string} event
   * @param {function} callback
   */
  on(subject, event, callback) {
    console.log(`Registering new callback for subject ${subject} and event ${event}`);
    if (!(subject in this.eventCallbacks)) {
      this.eventCallbacks[subject] = {};
    }

    if (!(event in this.eventCallbacks[subject])) {
      this.eventCallbacks[subject][event] = [];
    }

    this.eventCallbacks[subject][event].push(callback);
  }

  _bootstrapTenant(subject, tenant, mode, isGlobal = false, config = defaultConfig.kafka) {
    console.log(`Bootstraping tenant ${tenant} for subject ${subject}.`);
    console.log(`Global: ${isGlobal}, mode ${mode}`);
    let processKafkaMessagesCbk = (messages) => {
      this._processKafkaMessages(subject, tenant, messages);
    };

    this.topicManager.getTopic(subject, tenant, defaultConfig.databroker.host, isGlobal).then((topic) => {
      console.log(`topics: ${util.inspect(this.topics)}`);
      if (this.topics.indexOf(topic) != -1) {
        console.log(`There is already a consumer for this topic ${topic}.`);
        console.log(`Moving on.`);
        return;
      }
      console.log(`Got topic for subject ${subject} and tenant ${tenant}: ${topic}`);
      this.topics.push(topic);
      if (mode.indexOf('r') != -1) {
        let consumer = new Consumer(config.consumer);
        consumer.connect().then(() => {
          consumer.subscribe(topic);
          consumer.onMessageListener(processKafkaMessagesCbk);
        });
      }

      if (mode.indexOf('w') != -1) {
        console.log("Adding a producer topic.");
        if (!(subject in this.producerTopics)) {
          this.producerTopics[subject] = {};
        }
        this.producerTopics[subject][tenant] = topic;
        console.log(`Current producer topics are ${util.inspect(this.producerTopics, {depth: null})}`);
      }
    });
  }

  /**
   * Creates a new channel, which is related to tenants, subjects and Kafka
   * topics.
   * @param {string} subject The subject to be associated to this channel.
   * @param {string} mode "r" for reading-only channels, "w" for writeable, and "rw" for both.
   * @param {boolean} isGlobal flag indicating whether this channel is sensitive to tenants.
   * (is it group by tenants, such as in "device-data" subject, or not, such as in "dojot.tenancy"?)
   * @param {object} config The Kafka topic configuration.
   */
  createChannel(subject, mode, isGlobal, config = defaultConfig.kafka) {
    console.log(`Creating channel for subject ${subject}`);
    let associatedTenants = [];
    if (isGlobal === true) {
      associatedTenants = ["management"];
      this.globalSubjects.push({subject, mode});
    } else {
      associatedTenants = this.tenants;
      this.subjects.push({subject, mode});
    }

    for (let tenant of associatedTenants) {
      this._bootstrapTenant(subject, tenant, mode, isGlobal, config);
    }
  }

  _processKafkaMessages(subject, tenant, messages) {
    // for (const message of messages) {
      console.log(`received message: ${util.inspect(messages, {depth: null})} `);
      this.emit(subject, tenant, "message", messages.value.toString("utf-8"));
    // }
  }

  publish(subject, tenant, message) {
    console.log(`Trying to publish someting.Current producer topics are ${util.inspect(this.producerTopics, {depth: null})}`);
    if (!(subject in this.producerTopics)) {
      console.log(`No producer was created for subject ${subject}. Maybe it was not registered?`);
      return;
    }
    if (!(tenant in this.producerTopics[subject])) {
      console.log(`No producer was created for subject ${subject}@${tenant}. Maybe this tenant doesn't exist?`);
      return;
    }

    this.producer.produce(this.producerTopics[subject][tenant], message);
  }
}

module.exports = dojot;