"use strict";
var Dojot = require("./dojot");

var dojot = new Dojot("sample");
var logger = require("../Log/logger").logger;


dojot.createChannel("device-data", "rw");
dojot.createChannel("dojot.tenancy", "r", true);

dojot.on("device-data", "message", (tenant, msg) => {
  logger.info(`Client: Received message in device-data subject.`);
  logger.info(`Client: Tenant is: ${tenant}`);
  logger.info(`Client: Message is: ${msg}`);
});

dojot.on("dojot.device-manager.device", "message", (tenant, msg) => {
  logger.info(`Client: Received message in dojot.device-manager.device subject.`);
  logger.info(`Client: Tenant is: ${tenant}`);
  logger.info(`Client: Message is: ${msg}`);
});

dojot.on("dojot.device-manager.statistics", "message", (tenant, msg) => {
  logger.info(`Client: Received message in dojot.device-manager.statistics subject.`);
  logger.info(`Client: Tenant is: ${tenant}`);
  logger.info(`Client: Message is: ${msg}`);
});

dojot.on("dojot.tenancy", "new-tenant", (tenant, newtenant) => {
  logger.info(`Client: Received message in tenancy subject.`);
  logger.info(`Client: Tenant is: ${newtenant}`);
});

let i = 0;
let sendMessage = () => {
  i++;
  let msg = "this is a device attribute message - " + i;
  dojot.publish("device-data", "admin", msg);
  setTimeout(() => {
    sendMessage();
  }, 10000);
};

sendMessage();


