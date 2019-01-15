"use strict";
const express = require("express");
const app = express();
const uuid = require("uuid");
var dojot = require("../");

const messages = {
  subjectA: {},
  subjectB: {},
  serviceStatus: {}
};

const APP_PORT = 5002;
var messenger;

function initDojotModule() {
  var config = dojot.Config;
  config.kafka.consumer["group.id"] = "test-consumer-" + uuid.v1();
  config.databroker.url = `http://localhost:${APP_PORT}`;
  config.auth.url = config.databroker.url;

  messenger = new dojot.Messenger("dojot-snoop", config);

  messenger.init().then(() => {
    // Create a channel using a default subject "device-data"
    messenger.createChannel("subjectA", "rw");
    messenger.createChannel("subjectB", "rw");
    messenger.createChannel("serviceStatus", "rw");

    // Register callback to process incoming device data
    messenger.on("subjectA", "message", (tenant, msg) => {
      console.log(`got a message from subjectA: ${tenant}, ${msg}`);
      if (!(tenant in messages.subjectA)) {
        messages.subjectA[tenant] = [];
      }
      messages.subjectA[tenant].push(msg);
    });

    // Register callback to process incoming device data
    messenger.on("subjectB", "message", (tenant, msg) => {
      console.log(`got a message from subjectB: ${tenant}, ${msg}`);
      if (!(tenant in messages.subjectB)) {
        messages.subjectB[tenant] = [];
      }
      messages.subjectB[tenant].push(msg);
    });

    // Register callback to process incoming device data
    messenger.on("serviceStatus", "message", (tenant, msg) => {
      console.log(`got a message from serviceStatus: ${tenant}, ${msg}`);
      if (!(tenant in messages.serviceStatus)) {
        messages.serviceStatus[tenant] = [];
      }
      messages.serviceStatus[tenant].push(msg);
    });

  });

}

function initExpressApp() {
  console.log("Initializing mocks");
  app.use((req, res, next) => {
    const rawToken = req.header("authorization");
    if (rawToken !== undefined) {
      const token = rawToken.split(".");
      const tokenData = JSON.parse(new Buffer(token[1], "base64").toString());
      req.service = tokenData.service;
    }
    next();
  });

  app.get("/logs", (req, res) => {
    res.json(messages);
  });

  app.get("/send", (req, res) => {
    // Publish a message on "service-status" subject using "dojot-management" tenant
    console.log("publishing");
    messenger.publish("serviceStatus", "admin", "service X is up");
    res.json(messages);
  });

  app.get("/topic/:subject", (req, res) => {
    res.json({topic: "topic-" + req.params.subject + "-" + req.service});
  });

  app.get("/admin/tenants", (req, res) => {
    res.json({"tenants" : ["admin"]});
  });

  app.listen(APP_PORT, "0.0.0.0", () => {
    console.log("started");
    initDojotModule();
  });
}


initExpressApp();
