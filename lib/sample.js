"use strict";
var dojot = require("@dojot/dojot-module");
var logger = require("@dojot/dojot-module-logger").logger;

var messenger = new dojot.Messenger("sample");
var config = dojot.Config;

function subscribeToSubjects(messenger) {

    // This will create "communication channels"
    messenger.createChannel("device-data", "rw");
    messenger.createChannel("iotagent-info", "rw");

    messenger.on(config.dojot.subjects.deviceData, "message", (tenant, msg) => {
    logger.info(`Client: Received message in device data subject.`);
    logger.info(`Client: Tenant is: ${tenant}`);
    logger.info(`Client: Message is: ${msg}`);
    });

    messenger.on("iotagent-info", "message", (tenant, msg) => {
    logger.info(`Client: Received message in iotagent-info subject.`);
    logger.info(`Client: Tenant is: ${tenant}`);
    logger.info(`Client: Message is: ${msg}`);
    });


    let i = 0;
    let sendMessage = () => {
      i++;
      let msg = "iotagent - info " + i;
      messenger.publish("iotagent-info", "admin", msg);
      setTimeout(() => {
        sendMessage();
      }, 10000);
    };

    sendMessage();
}

// Initialize messenger
messenger.init().then(() => {subscribeToSubjects(messenger); });

