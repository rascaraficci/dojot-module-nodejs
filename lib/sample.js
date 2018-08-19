"use strict";
var dojot = require("../");

var messenger = new dojot.Messenger("sample");
var logger = dojot.Logger.logger;
var config = require("./config");


messenger.createChannel("device-data", "rw");
messenger.createChannel("dojot.tenancy", "r", true);

messenger.on(config.dojot.subjects.deviceData, "message", (tenant, msg) => {
  logger.info(`Client: Received message in device data subject.`);
  logger.info(`Client: Tenant is: ${tenant}`);
  logger.info(`Client: Message is: ${msg}`);
});

messenger.on(config.dojot.subjects.devices, "message", (tenant, msg) => {
  logger.info(`Client: Received message in messenger.device-manager.device subject.`);
  logger.info(`Client: Tenant is: ${tenant}`);
  logger.info(`Client: Message is: ${msg}`);
});

messenger.on(config.dojot.subjects.statistics, "message", (tenant, msg) => {
  logger.info(`Client: Received message in messenger.device-manager.statistics subject.`);
  logger.info(`Client: Tenant is: ${tenant}`);
  logger.info(`Client: Message is: ${msg}`);
});

messenger.on(config.dojot.subjects.tenancy, "new-tenant", (tenant, newtenant) => {
  logger.info(`Client: Received message in tenancy subject.`);
  logger.info(`Client: Tenant is: ${newtenant}`);
});

let i = 0;
let sendMessage = () => {
  i++;
  let msg = "this is a device attribute message - " + i;
  messenger.publish(config.dojot.subjects.deviceData, "admin", msg);
  setTimeout(() => {
    sendMessage();
  }, 10000);
};

sendMessage();


