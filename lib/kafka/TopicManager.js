var axios = require("axios");
var config = require("../config");
class TopicManager {
  constructor() {
    this.topics = {};
  }

  /**
   * [getToken description]
   * @param  {[string]} tenant dojot tenant for which the token should be valid for
   * @return {[string]}        JWT token to be used in requests
   */
  getToken(tenant) {
    const payload = {
      service: tenant,
      username: config.dojot.managementService
    };
    return (
      new Buffer("jwt schema").toString("base64") +
      "." +
      new Buffer(JSON.stringify(payload)).toString("base64") +
      "." +
      new Buffer("dummy signature").toString("base64")
    );
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
        authorization: `Bearer ${this.getToken(tenant)}`
      }
    });
    this.topics[key] = response.data.topic;
    return response.data.topic;
  }
}

module.exports = TopicManager;
