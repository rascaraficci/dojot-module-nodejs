var axios = require("axios");

class TopicManager {
    constructor() {
      this.topics = {};
    }
  
    getTopic(subject, tenant, broker, global) {
      const key = tenant + ':' + subject;
      
      if (this.topics.hasOwnProperty(key)) {
        return Promise.resolve(this.topics[key]);
      }
  
      const querystring = global ? "?global=true" : "";
      const url = `${broker}/topic/${subject + querystring}`
  
      return axios({
        url,
        method: 'get',
        headers: { authorization: `Bearer ${getToken(tenant)}`}
      })
      .then((response) => {
        this.topics[key] = response.data.topic;
        
        return response.data.topic
      });
    }
}

module.exports = TopicManager
