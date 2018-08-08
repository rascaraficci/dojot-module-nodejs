const Kafka = require('node-rdkafka');
const config = require('./config');

class Producer {

  constructor() {
    console.log('Creating a new Kafka producer...');
    this.producer = new Kafka.Producer(config.kafka.producer);

    console.log('Initing Kafka producer...');
    this.initProducer();

  }

  initProducer() {

    // Connect to the broker manually

    console.log('Connecting the producer to broker...');
    this.producer.connect();

    // Any errors we encounter, including connection errors
    this.producer.on('event.error', err => {
      console.error('Error from producer');
      console.error(err);
    });

  }

  sendMessage(message, topic, partition = -1, keyed = null) {

    // Wait for the ready event before proceeding
    this.producer.on('ready', () => {
      console.log(`Producer connected. Trying to send a message to topic ${topic}`);
      let bufferedMessage = new Buffer(message);

      try {
        this.producer.produce(topic, partition, bufferedMessage, keyed, Date.now());
        console.log('Message was sent!');
      } catch (err) {
        console.error('A problem occurred when sending our message');
        console.error(err);
      }
    
    });

  }

  disconnectProducer() {
    console.log("Disconnecting the producer...");
    this.producer.disconnect();

    producer.on('disconnected', (arg) => {
      console.log('producer disconnected. ' + JSON.stringify(arg));
    });
    
  }

}

module.exports = Producer;
