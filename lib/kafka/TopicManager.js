"use strict";

var axios = require("axios");
var auth = require("../auth");
var defaultConfig = require("../config");
var logger = require("@dojot/dojot-module-logger").logger;
var util = require("util");

const TAG = { filename: "topic-mgr" };

/**
 * Class responsible for dealing with topics.
 *
 * This class will handle any functionality related to topics (Kafka's,
 * particularly) and its relationship with subjects and tenants.
 */
class TopicManager {

  constructor(config = defaultConfig) {
    this.topics = {};
    this.tenants = [];
    this.config = config;
  }

  getKey(subject, tenant) {
    return tenant + ":" + subject;
  }

  /**
   * Retrieve a topic from Data Broker.
   *
   * This function will request Data Broker for a Kafka topic, given a subject
   * and a tenant. It will retry a few times (configured in config object) and
   * will reject the promise if it is unable to reach Data Broker for any
   * reason. This promise will also be rejected if the response is not a valid
   * JSON or contains invalid data.
   *
   * All topics are cached in order to speed up future requests.
   *
   * If true, the global parameter will indicate to Data Broker that the
   * requested topic should be the same for all tenants. This is useful when
   * dealing with topics that are intended to contain messages not related to
   * tenants, such as messages related to services.
   *
   * @param {string} subject The subject related to the requested topic
   * @param {string} tenant The tenant related to the requested topic
   * @param {string} broker URL where data broker can be accessed
   * @param {boolean} global true if this topic should be sensitive to tenants
   */
  async getTopic(subject, tenant, broker, global) {
    const key = this.getKey(subject, tenant);

    if (this.topics.hasOwnProperty(key)) {
      return Promise.resolve(this.topics[key]);
    }

    const querystring = global ? "?global=true" : "";
    const url = `${broker}/topic/${subject + querystring}`;

    return new Promise((resolve, reject) => {
      let doIt = (counter) => {
        axios({
          url,
          method: "get",
          headers: {
            authorization: `Bearer ${auth.getManagementToken(tenant, this.config)}`
          }
        }).then((response) => {
          if ((typeof(response.data) === "object") && ("topic" in response.data)) {
            this.topics[key] = response.data.topic;
            return resolve(response.data.topic);
          } else {
            return reject(`Invalid response from Data Broker: ${response.data}`);
          }
        }).catch((error) => {
          logger.error(`Could not get topic for ${subject}@${tenant} (global ${global})`, TAG);
          logger.error(`Error is: ${error}`);
          logger.debug(`Trying again in a few moments.`, TAG);
          counter--;
          logger.debug(`Remaining ${counter} time(s).`, TAG);
          if (counter > 0) {
            setTimeout(() => {
              doIt(counter);
            }, this.config.databroker.timeoutSleep * 1000);
          } else {
            return reject(`Could not reach DataBroker.`);
          }
        });
      };
      doIt(this.config.databroker.connectionRetries);
    });
  }
}

module.exports = TopicManager;
