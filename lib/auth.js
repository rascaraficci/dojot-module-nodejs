"use strict";
var axios = require("axios");
var config = require("./config");
var logger = require("@dojot/dojot-module-logger").logger;

const TAG = { filename: "auth" };

/**
 * Generates a dummy token
 * @param {string} tenant Tenant to be used when creating the token
 */
function getManagementToken(tenant) {
  const payload = {
    service: tenant,
    username: config.dojot.management.user
  };
  return (
    new Buffer("jwt schema").toString("base64") +
    "." +
    new Buffer(JSON.stringify(payload)).toString("base64") +
    "." +
    new Buffer("dummy signature").toString("base64")
  );
}

function getTenants(auth) {
  const url = `${auth}/admin/tenants`;
  return new Promise((resolve, reject) => {
    let doIt = (counter) => {
      axios({
        url,
        method: "get",
        headers: {
          authorization: `Bearer ${getManagementToken(config.dojot.management.tenant)}`,
        }
      }).then((response) => {
        logger.error(`Tenants retrieved: ${response.data.tenants}.`, TAG);
        resolve(response.data.tenants);
      }).catch((error) => {
        logger.error(`Could not initialize tenancy consumer: ${error}.`, TAG);
        logger.debug(`Trying again in a few moments.`, TAG);
        counter--;
        logger.debug(`Remaining ${counter} time(s).`, TAG);
        if (counter > 0) {
          setTimeout(() => {
            doIt(counter);
          }, config.auth.timeoutSleep * 1000);
        } else {
          reject(`Could not reach Auth.`, TAG);
        }
      });
    };
    doIt(config.auth.connectionRetries);
  });
}

module.exports = { getManagementToken, getTenants };
