"use strict";
var axios = require("axios");
var config = require("./config");
var logger = require("@dojot/dojot-module-logger").logger;

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

async function getTenants(auth) {
  const url = `${auth}/admin/tenants`;
  logger.info(`Retriving tenants from ${url} `);

  let response = await axios({
    url,
    method: "get",
    headers: {
      authorization: `Bearer ${getManagementToken(config.dojot.management.tenant)}`,
    }
  });
  return response.data.tenants;
}

module.exports = { getManagementToken, getTenants };
