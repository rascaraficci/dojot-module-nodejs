const Kafka = require('node-rdkafka');

class Producer {

  constructor(producerConfig) {
    console.log('Creating a new Kafka producer...');
    this.isReady = false;
    this.producer = new Kafka.Producer(producerConfig);
    this.sendCallback();
  }

  connect() {
    const readyPromise = new Promise((resolve, reject) => {
      const timeoutTrigger = setTimeout(() => {
        console.error("Failed to connect the producer.");
        reject();
      }, 1000);

      this.producer.on("ready", () => {
          console.log("Producer is ready.");
          this.isReady = true;
          clearTimeout(timeoutTrigger);
          resolve();
      });
    });

    this.producer.connect(null);
    return readyPromise;
  }

  produce(topic, message, key=null, partition=null) {
    return new Promise((resolve, reject) => {
      
      const timeStamp = Date.now();

      const buffer = new Buffer(message);

      const callback = {resolve, reject};

      this.producer.produce(topic, partition, buffer, key, timeStamp, {callback});

      //Poll events emit for delivery reports
      this.producer.poll();
    });
  }

  /*Flush the librdkafka internal queue, sending all messages. Default timeout is 500ms*/
  _flush(timeout=500) {
    return new Promise((resolve, reject) => {
      this.producer.flush(timeout, err => {
        if (err) {
          reject(err);
        } else {
          console.log("All messages is flushed.");
          resolve();
        }
      });
    });
  }

  async disconnect() {

    try {
      await this._flush();
    } catch (error) {
      console.error("Error on flush message in Kafka", err);
      throw err;
    }
    
    console.log("Flush done, disconnecting the producer...");

    const disconnectPromise = new Promise((resolve, reject) => {
      const timeoutTrigger = setTimeout(() => {
        console.error("Unable to disconnect the producer");
        reject();
      }, 10000);

      this.producer.disconnect((err) => {
        clearTimeout(timeoutTrigger);

        if (err) {
          console.error(err);
        } else {
          console.log('disconnected');
          resolve();
        }
      });
    });

    return disconnectPromise;
  }

  _resolveOnDeliveryReport(err, report) {
    if (report.opaque.callback) {
      if (err) {
        report.opaque.callback.reject(err); 

      }else {
        report.opaque.callback.resolve(report);
      }
    }
  }

  sendCallback() {
    this.producer.on("delivery-report", this._resolveOnDeliveryReport);
    this.producer.setPollInterval(100);
  }

}

module.exports = Producer;
