const logger = require("../log/logger").logger;
const Kafka = require('node-rdkafka');

class Consumer {

  constructor(consumerConfig) {
    console.log('Creating a new Kafka consumer...');
    this.consumer = new Kafka.KafkaConsumer(consumerConfig);
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
        resolve();
      });
    });

    this.consumer.connect(null);
    return readyPromise;
  }

  subscribe(topic) {
    this.consumer.subscribe([topic]);
    console.log(`Subscribed to topic ${topic}`);
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

  onMessageListener(callback) {
        this.consumer.consume();
        this.consumer.on('data', (messages) => {
          callback(messages);
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


