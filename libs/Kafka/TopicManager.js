var axios = require("axios");

class TopicManager {
    constructor() {
      this.topics = {};
    }

    async getTopic(subject, tenant, broker, global) {
      const key = tenant + ':' + subject;

      if (this.topics.hasOwnProperty(key)) {
        return Promise.resolve(this.topics[key]);
      }

      const querystring = global ? "?global=true" : "";
      const url = `${broker}/topic/${subject + querystring}`;

      let response = await axios({
        url,
        method: 'get',
        headers: { authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJObU9zZ2h2b1dQMHVxVEM5WnF3M0o5YnJON043T05yWSIsImlhdCI6MTUzNDY4NjkzNiwiZXhwIjoxNTM0Njg3MzU2LCJuYW1lIjoiQWRtaW4gKHN1cGVydXNlcikiLCJlbWFpbCI6ImFkbWluQG5vZW1haWwuY29tIiwicHJvZmlsZSI6ImFkbWluIiwiZ3JvdXBzIjpbMV0sInVzZXJpZCI6MSwianRpIjoiMGVmZGMwZjVkNzJmOWUzZmQzMGU3NDA3MGM1ZjY5NWEiLCJzZXJ2aWNlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImFkbWluIn0.hgsEZ1Z6uOhS5VdwT1iFucll6FKPquUbkMY3n_TVHec`}
      });
      this.topics[key] = response.data.topic;
      return response.data.topic;
    }
}

module.exports = TopicManager;
