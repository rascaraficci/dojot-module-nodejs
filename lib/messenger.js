"use strict";

var TopicManager = require("./kafka/TopicManager");
var Consumer = require("./kafka/Consumer");
var Producer = require("./kafka/Producer");
var defaultConfig = require("./config");
var uuid = require("uuid");
var util = require("util");
var logger = require("@dojot/dojot-module-logger").logger;
var auth = require("./auth");
var axios = require("axios");

class Messenger {
  constructor(name, config) {
    this.topicManager = new TopicManager();
    this.eventCallbacks = {};
    this.tenants = [];
    this.subjects = {};
    this.topics = [];
    this.producerTopics = {};
    this.globalSubjects = {};
    this.queuedMessages = [];
    this.instanceId = name + '-' + uuid.v4();
    
    this.config = config || defaultConfig;

    let producer = this.config.kafka.producer;
    producer["client.id"] = this.instanceId;
    this.producer = new Producer(producer);
    this.producer.connect().then(() => {
      logger.info(`Producer for module ${this.instanceId} is ready.`);
      logger.info(`Sending pending messages...`);
      for (let msg of this.queuedMessages) {
        this.publish(msg.subject, msg.tenant, msg.message);
      }
      this.queuedMessages = [];
    }).catch((error) => {
      logger.error(`Could not create producer: ${error}`);
      process.exit();
    });

    // This should only get new messages.
    this.createChannel(this.config.dojot.subjects.tenancy, "r", true /*global*/);      
    this.consumer = new Consumer(this.config.kafka.consumer);
    let connectConsumerFn = () => {
      this.consumer.connect().then(() => {
        logger.warn(`Global consumer connected`);
      }).catch((error) => {
        logger.warn(`Could not connect consumer: ${error}`);
        logger.warn("Trying it again in 5 seconds.");
        setTimeout(() => {
          connectConsumerFn();
        }, 5000);
      });
    };
    connectConsumerFn();
  }

  /**
   * Initializes the messenger
   * @return a promise
   */
  init() {
    return new Promise ((resolve) => {
      let processNewTenantCbk = this._processNewTenant.bind(this);
      this.on(this.config.dojot.subjects.tenancy, "message", processNewTenantCbk);

      // There should be a auth call here, to get all previous configured
      // tenants.
      let getAllTenants = (authHost) => {
        auth.getTenants(authHost).then((tenants) => {
          logger.info(`Retrieved list of tenants: ${tenants}.`);
          for (const tenant of tenants){ 
            logger.info(`Bootstrapping tenant ${tenant}...`);
            this._processNewTenant(this.config.dojot.managementService, JSON.stringify({tenant}));
            logger.info(`... ${tenant} bootstrapped.`);
          }
          logger.info(`Finished tenant bootstrapping.`);
          resolve();
        }).catch((error) => {
          logger.warn(`Could not get list of current tenants: ${error}`);
          logger.warn("Trying it again in a few seconds.");
          setTimeout(() => {
            getAllTenants(authHost);
          }, 5000);
        });
      };
      
      getAllTenants(this.config.auth.host);
    });
  }

  /**
   * Process a new tenant.
   * Whenever a new tenant is detected, it will request all the topics for
   * current active subjects.
   * @param {string} tenant Management tenant.
   * @param {string} msg The message describing the new tenant.
   */
  _processNewTenant(tenant, msg) {
    logger.debug(`Received message in tenancy subject.`);
    logger.debug(`Tenant is: ${tenant}`);
    logger.debug(`Message is: ${util.inspect(msg, {depth: null})}`);

    let data;
    try {
      data = JSON.parse(msg);
    } catch (error) {
      logger.warn("Data is not a valid JSON. Bailing out.");
      logger.warn(`Error is: ${error}`);
      return;
    }

    // Perform some sanity checks here
    if (!("tenant" in data)) {
      logger.warn("Received message is invalid. Bailing out.");
      return;
    }
    if (this.tenants.indexOf(data.tenant) != -1) {
      logger.warn("This tenant was already registered. Bailing out.");
      return;
    }

    this.tenants.push(data.tenant);
    for (let subject in this.subjects) {
      this._bootstrapTenant(subject, data.tenant, this.subjects[subject].mode);
    }
    this.emit(this.config.dojot.subjects.tenancy, this.config.dojot.managementService, "new-tenant", data.tenant);
  }

  emit(subject, tenant, event, data) {
    logger.debug(`Emitting new event ${event} for subject ${subject}@${tenant}`);
    // Sanity checks
    if (!(subject in this.eventCallbacks)) {
      logger.debug(`No one is listening to subject ${subject} events.`);
      return;
    }

    if (!(event in this.eventCallbacks[subject])) {
      logger.debug(`No one is listening to subject ${subject} ${event} events.`);
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
    logger.debug(`Registering new callback for subject ${subject} and event ${event}`);
    if (!(subject in this.eventCallbacks)) {
      this.eventCallbacks[subject] = {};
    }

    if (!(event in this.eventCallbacks[subject])) {
      this.eventCallbacks[subject][event] = [];
    }

    this.eventCallbacks[subject][event].push(callback);

    if (!(subject in this.subjects) && !(subject in this.globalSubjects)) {
      this.createChannel(subject);
    }
  }

  _bootstrapTenant(subject, tenant, mode, isGlobal = false) {
    console.log(`Bootstraping tenant ${tenant} for subject ${subject}.`);
    console.log(`Global: ${isGlobal}, mode ${mode}`);
    let processKafkaMessagesCbk = (messages) => {
      this._processKafkaMessages(subject, tenant, messages);
    };

    logger.debug(`Requesting topic for ${subject}@${tenant}...`);
    this.topicManager.getTopic(subject, tenant, this.config.databroker.host, isGlobal).then((topic) => {
      if (this.topics.indexOf(topic) != -1) {
        logger.info(`already have a topic for ${subject}@${tenant}`);
        return;
      }
      logger.debug(`Got topic for subject ${subject} and tenant ${tenant}: ${topic}`);
      this.topics.push(topic);
      if (mode.indexOf('r') != -1) {
        this.consumer.subscribe(topic, processKafkaMessagesCbk);
      }

      if (mode.indexOf('w') != -1) {
        logger.debug("Adding a producer topic.");
        if (!(subject in this.producerTopics)) {
          this.producerTopics[subject] = {};
        }
        this.producerTopics[subject][tenant] = topic;
      }
    }).catch((error) => {
      logger.warn(`Could not get topic: ${error}`);
    });
    logger.debug(`... topic for ${subject}@${tenant} was requested.`);
  }

  /**
   * Creates a new channel, which is related to tenants, subjects and Kafka
   * topics.
   * @param {string} subject The subject to be associated to this channel.
   * @param {string} mode "r" for reading-only channels, "w" for writeable, and "rw" for both.
   * @param {boolean} isGlobal flag indicating whether this channel is sensitive to tenants.
   * (is it group by tenants, such as in "device-data" subject, or not, such as in "dojot.tenancy"?)
   */
  createChannel(subject, mode = "r", isGlobal = false) {
    logger.info(`Creating channel for subject ${subject}`);
    let associatedTenants = [];
    if (isGlobal === true) {
      associatedTenants = [this.config.dojot.managementService];
      this.globalSubjects[subject] = { mode };
    } else {
      associatedTenants = this.tenants;
      this.subjects[subject] = { mode };
    }

    for (let tenant of associatedTenants) {
      this._bootstrapTenant(subject, tenant, mode, isGlobal);
    }
  }

  _processKafkaMessages(subject, tenant, messages) {
      logger.debug(`Received message: ${util.inspect(messages, {depth: null})} `);
      this.emit(subject, tenant, "message", messages.value.toString("utf-8"));
  }

  publish(subject, tenant, message) {
    if (this.producer.isReady === false) {
      logger.debug("Producer is not yet ready. Queueing this message.");
      this.queuedMessages.push({subject, tenant, message});
      return;
    }
    logger.debug(`Trying to publish someting. Current producer topics are ${util.inspect(this.producerTopics, {depth: null})}`);
    if (!(subject in this.producerTopics)) {
      logger.warn(`No producer was created for subject ${subject}. Maybe it was not registered?`);
      logger.warn(`Message ${message} is being discarded!`);
      return;
    }
    if (!(tenant in this.producerTopics[subject])) {
      logger.warn(`No producer was created for subject ${subject}@${tenant}. Maybe this tenant doesn't exist?`);
      logger.warn(`Message ${message} is being discarded!`);
      return;
    }

    this.producer.produce(this.producerTopics[subject][tenant], message);
  }

  generateDeviceCreateEventForActiveDevices() {
    logger.debug('Requesting all active divices');
    let requestDevice = (tenant, pageNum) => {
      let extraArg = '';
      if (pageNum > 0) {
        extraArg = '?' + pageNum;
      }

      axios({
        url: this.config.deviceManager.host + "/device" + extraArg,
        method: "get",
        headers: {
          authorization: `Bearer ${auth.getManagementToken(tenant)}`,
        }
      }).then( (response) => {
        for (let device of response.data.devices) {
          let eventData = {
            event: "create",
            meta: {
              service: tenant
            },
            data: device
          };

          this.emit("iotagent.device", tenant, "device.create", eventData);
        }
        // take care about pagination
        if (response.data.has_next) {
          requestDevice(tenant, response.data.next_page);
        }
      }).catch ( (error) => {
        logger.error(error);
      });
    }

    for (let tenant of this.tenants) {
      requestDevice(tenant, 0);
    }
  }
}

module.exports = {Messenger};
