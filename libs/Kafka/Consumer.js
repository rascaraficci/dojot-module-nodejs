const Kafka = require('node-rdkafka');

class Consumer {

  constructor(consumerConfig) {
    console.log('Creating a new Kafka consumer...');
    this.consumer = new Kafka.KafkaConsumer(consumerConfig);
  }

  connect() {

    console.log("Connecting the consumer ..")
    const readyPromise = new Promise((resolve, reject) => {
      const timeoutTrigger = setTimeout(() => {
          console.error("Failed to connect the consumer.");
          reject();
      }, 1000);

      this.consumer.on("ready", () => {
          console.log("Consumer is connected");
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

          if (messages != []) {
            
          }
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
 

