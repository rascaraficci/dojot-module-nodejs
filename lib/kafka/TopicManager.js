"use strict";

var axios = require("axios");
var auth = require("../auth");
var config = require("../config");
var logger = require("@dojot/dojot-module-logger").logger;

const TAG = { filename: "topic-mgr" };
/**
 * Class for topic management
 */
class TopicManager {
  constructor() {
    this.topics = {};
    this.tenants = [];
  }

  getKey(subject, tenant) {
    return tenant + ":" + subject;
  }

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
            authorization: `Bearer ${auth.getManagementToken(tenant)}`
          }
        }).then((response) => {
          this.topics[key] = response.data.topic;
          resolve(response.data.topic);
        }).catch((error) => {
          logger.error(`Could not get topic for ${subject}@${tenant} (global ${global})`, TAG);
          logger.error(`Error is: ${error}`);
          logger.debug(`Trying again in a few moments.`, TAG);
          counter--;
          logger.debug(`Remaining ${counter} time(s).`, TAG);
          if (counter > 0) {
            setTimeout(() => {
              doIt(counter);
            }, config.databroker.timeoutSleep * 1000);
          } else {
            reject(`Could not reach DataBroker.`);
          }
        });
      };
      doIt(config.databroker.connectionRetries);
    });
  }
}

module.exports = TopicManager;
