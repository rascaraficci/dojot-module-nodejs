const Kafka = require('node-rdkafka');
const config = require('./config');
class Consumer {

  constructor() {
    console.log('Creating a new Kafka consumer...');
    this.consumer = new Kafka.KafkaConsumer(config.kafka.consumer);
    this.initConsumer();
  }

  initConsumer() {
    console.log('Connecting the consumer to broker...');
    this.consumer.connect();
  }

  subscribe(topic) {
    this.consumer.on('ready', () => {

      // This makes subsequent consumes read from that topic.
      this.consumer.subscribe([topic]);
      console.log('Message found!  Contents below.');

      // Read one message every 50 milliseconds
      setInterval(() => {
        this.consumer.consume(1);
      }, 50);

    }).on('data',(data) => {
      console.log(data.value.toString());
    });

  }

}


module.exports = Consumer;
 
