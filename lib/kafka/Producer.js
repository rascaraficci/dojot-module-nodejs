const Kafka = require('node-rdkafka');
var logger = require("@dojot/dojot-module-logger").logger;

const TAG = { filename: "producer" };

class Producer {

  constructor(config) {
    logger.debug('Creating a new Kafka producer...', TAG);
    this.isReady = false;
    this.producer = new Kafka.Producer(config.kafka.producer);
    this.sendCallback();
  }

  connect() {
    var alreadyConnected = false;
    const readyPromise = new Promise((resolve, reject) => {
      const timeoutTrigger = setTimeout(() => {
        console.error("Failed to connect the producer.");
        if (alreadyConnected == false) {
          reject("timeout");
        }
      }, 5000);

      this.producer.on("ready", () => {
        logger.debug("Producer is ready.", TAG);
        this.isReady = true;
        clearTimeout(timeoutTrigger);
        alreadyConnected = true;
        resolve();
        return;
      });

      this.producer.on("event.error", (error) => {
        logger.debug(`Error while creating producer: ${error}`, TAG);
        if (alreadyConnected == false) {
          reject(error);
        }
        return;
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
  _flush(timeout=2000) {
    return new Promise((resolve, reject) => {
      this.producer.flush(timeout, err => {
        if (err) {
          reject(err);
        } else {
          logger.debug("All messages were flushed.", TAG);
          resolve();
        }
      });
    });
  }

  async disconnect() {

    try {
      await this._flush();
    } catch (error) {
      console.error("Error on flush message in Kafka", error);
      throw error;
    }

    logger.debug("Flush done, disconnecting the producer...", TAG);

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
          logger.debug('disconnected', TAG);
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
