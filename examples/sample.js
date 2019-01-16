"use strict";
var dojot = require("@dojot/dojot-module");
var logger = require("@dojot/dojot-module-logger").logger;

var config = dojot.Config;
var messenger = new dojot.Messenger("dojot-snoop", config);
messenger.init();

// Create a channel using a default subject "device-data"
messenger.createChannel(config.dojot.subjects.deviceData, "rw");

// Create a channel using a particular subject "service-status"
messenger.createChannel("service-status", "w");

// Register callback to process incoming device data
messenger.on(config.dojot.subjects.deviceData, "message", (tenant, msg) => {
  logger.info(`Client: Received message in device data subject.`);
  logger.info(`Client: Tenant is: ${tenant}`);
  logger.info(`Client: Message is: ${msg}`);
});

// Publish a message on "service-status" subject using "dojot-management" tenant
messenger.publish("service-status", config.management.tenant, "service X is up");
