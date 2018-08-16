"use strict";
var Dojot = require("./dojot");

var dojot = new Dojot("sample");


dojot.createChannel("device-data", "rw");
dojot.createChannel("dojot.device-manager.device", "r");
dojot.createChannel("dojot.device-manager.statistics", "r");
dojot.createChannel("dojot.tenancy", "r", true);

dojot.on("device-data", "message", (tenant, msg) => {
  console.log(`Client: Received message in device-data subject.`);
  console.log(`Client: Tenant is: ${tenant}`);
  console.log(`Client: Message is: ${msg}`);
});

dojot.on("dojot.device-manager.device", "message", (tenant, msg) => {
  console.log(`Client: Received message in dojot.device-manager.device subject.`);
  console.log(`Client: Tenant is: ${tenant}`);
  console.log(`Client: Message is: ${msg}`);
});

dojot.on("dojot.device-manager.statistics", "message", (tenant, msg) => {
  console.log(`Client: Received message in dojot.device-manager.statistics subject.`);
  console.log(`Client: Tenant is: ${tenant}`);
  console.log(`Client: Message is: ${msg}`);
});

dojot.on("dojot.tenancy", "new-tenant", (tenant, newtenant) => {
  console.log(`Client: Received message in tenancy subject.`);
  console.log(`Client: Tenant is: ${newtenant}`);
});

let sendMessage = () => {
  let msg = "this is a device attribute message";
  dojot.publish("device-data", "admin", msg);
  setTimeout(() => {
    sendMessage();
  }, 1000);
};

sendMessage();


