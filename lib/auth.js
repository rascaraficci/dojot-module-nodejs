"use strict";
var KcAdminClient = require('keycloak-admin').default
var defaultConfig = require("./config");
var logger = require("@dojot/dojot-module-logger").logger;

const TAG = { filename: "auth" };

/**
 * Generates a dummy token
 * @param {string} tenant Tenant to be used when creating the token
 */
function getManagementToken(tenant, config = defaultConfig) {
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

function getTenants() {

  return new Promise((resolve, reject) => {

    let doIt = async (counter) => {

      const kcAdminClient = new KcAdminClient(
        { baseUrl: defaultConfig.keycloak.basePath }
      );

      try {
        logger.debug('Listing tenants from keycloak', TAG)
        await kcAdminClient.auth(defaultConfig.keycloak.credentials)
        const realms = await kcAdminClient.realms.find()
        logger.info(`Tenants retrieved: ${realms.map(r => r.id)}.`, TAG);
        resolve(realms.map(r => r.id))
      } catch (err) {
        logger.error(`Could not retrieve tenants: ${err}.`, TAG);
        if (counter > 0) {
          counter--;
          logger.debug(`Trying again in a few moments.`, TAG);
          logger.debug(`Remaining ${counter} time(s).`, TAG);
          setTimeout(() => {
            doIt(counter);
          }, defaultConfig.keycloak.timeoutSleep * 1000);
        } else {
          reject('keycloak admin: ' + err.message)
        }
      }
    }

    doIt(defaultConfig.keycloak.connectionRetries)

  });
}

module.exports = { getManagementToken, getTenants };
