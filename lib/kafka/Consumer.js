const logger = require("../log/logger").logger;
const Kafka = require('node-rdkafka');

class Consumer {

  constructor(consumerConfig) {
    console.log('Creating a new Kafka consumer...');
    this.consumer = new Kafka.KafkaConsumer(consumerConfig);
    this.isReady = false;

    this.messageCallbacks = {};
    this.subscriptions = [];
  }

  connect() {

    logger.info("Connecting the consumer ..");
    const readyPromise = new Promise((resolve, reject) => {
      const timeoutTrigger = setTimeout(() => {
        logger.warn("Failed to connect the consumer.");
        reject("timed out");
      }, 5000);

      this.consumer.on("ready", () => {
        logger.info("Consumer is connected");
        clearTimeout(timeoutTrigger);
        this.isReady = true;
        if (this.subscriptions.length != 0) {
          this.consumer.subscribe(this.subscriptions);
        }
        this.consumer.consume();
        resolve();
      });
    });

    this.consumer.connect();
    return readyPromise;
  }

  subscribe(topic, callback) {
    if (!(topic in this.messageCallbacks)) {
      this.messageCallbacks[topic] = [];
    }

    this.messageCallbacks[topic].push(callback);

    if (this.isReady == false) {
      this.subscriptions.push(topic);  
    } else {
      logger.debug(`Unsubscribing from topics ${this.subscriptions}`);
      this.consumer.unsubscribe();
      logger.debug(`Adding new topic ${topic}`);
      this.subscriptions.push(topic);
      logger.debug(`Subscribing to topics ${this.subscriptions}`);
      this.consumer.subscribe(this.subscriptions);
      this.consumer.on('data', (kafkaMessage) => {
        if (kafkaMessage.topic == topic) {
          for (let callback of this.messageCallbacks[topic]) {
            callback(kafkaMessage);
          }
        }
      });
      console.log(`Subscribed to topic ${topic}`);
    }
  }

  consume(maxMessages = 1) {
    return new Promise((resolve, reject) => {
      this.consumer.consume(maxMessages, (err, messages) => {
        if (err) {
          reject(err);
        } else {
          console.log("Message consumed!");
          resolve(messages);
        }
      });
    });
  }
  commit() {
    this.consumer.commit(null);
  }

  disconnect() {
    const disconnectPromise = new Promise((resolve, reject) => {
      const timeoutTrigger = setTimeout(() => {
        console.error("Unnable to disconnect the consumer.");
        reject();
      }, 100000);

      this.consumer.disconnect((err, info) => {

        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log("disconnected!");
          clearTimeout(timeoutTrigger);
          resolve(info);
        }
      });
    });

    return disconnectPromise;
  }

}

module.exports = Consumer;


