"use strict";
var axios = require("axios");
var config = require("./config");
var logger = require("@dojot/dojot-module-logger").logger;
/**
 * [getToken description]
 * @param  {[string]} tenant dojot tenant for which the token should be valid for
 * @return {[string]}        JWT token to be used in requests
 */
function getManagementToken(tenant) {
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

async function getTenants(auth) {
  const url = `${auth}/admin/tenants`;
  logger.info(`Retriving tenants from ${url} `);

  let response = await axios({
    url,
    method: "get",
    headers: {
      authorization: `Bearer ${getManagementToken(config.dojot.managementService)}`,
    }
  });
  return response.data.tenants;
}

module.exports = { getManagementToken, getTenants };
