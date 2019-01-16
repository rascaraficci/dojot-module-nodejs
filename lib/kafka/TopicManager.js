"use strict";

var axios = require("axios");
var auth = require("../auth");
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

    let response = await axios({
      url,
      method: "get",
      headers: {
        authorization: `Bearer ${auth.getManagementToken(tenant)}`
      }
    });
    this.topics[key] = response.data.topic;
    return response.data.topic;
  }
}

module.exports = TopicManager;
