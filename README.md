# dojot-module

Common library to be used in dojot modules.

## How to install

Installing this package is no different than any other from npm. Just execute:

```bash

npm install @dojot/dojot-module

```

which will install this module in its latest version.

## How to use

Using it is also very easy. All normal operations involve using the Messenger
class, which is responsible for communicating with the message broker (Kafka)
and generating events to any component interested in such messages. Also, it
provides a very simple mechanism of event generation and subscription so that
a library could use it to generate more specific events based on those messages.
More on that later.

The folowing code is an example of a code that simply prints any message that
it receives from a particular subject.


```javascript
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
      messenger.publish("iotagent-info", "dojot-management", msg);
      setTimeout(() => {
        sendMessage();
      }, 10000);
    };

    sendMessage();
}

// Initialize messenger
messenger.init().then(subscribeToSubjects(messenger));

```

This sample code will only subscribe to two subjects: `dojot.device-manager.devices`,
which is set in `config.dojot.subjects.deviceData` default configuration
structure, and a particular for this example which is `iotagent-info`.

In order to work properly, there are a few things that must be set before
starting the client. These are the evironment variables that are used by this
library:

- KAFKA_HOSTS: The list of Kafka hosts which this library will try to connect
  to. This is a comma separated list, such as `kafka1:9092,kafka2:9092`;
- DATA_BROKER_URL: this is where DataBroker can be accessed, such as
  `http://data-broker`;
- AUTH_URL: where Auth service can be accessed. This is its full URL, such as
  `http://auth:5000/`;
- DEVICE_MANAGER_URL: where DeviceManager can be accessed. This is its full
  URL, such as `http://device-manager:5000`.

There are a bunch of other environment variables that can be used to fine tune
the library. You can check them in config.js file.


## How to emit new events

As said before, the Messenger class has a very simple event generation and
subscription mechanism. This can be explored by higher level libraries so that
they generate new events specifically tailored for its use cases. For instance,
dojot's own iotagent-nodejs is able to generate device-related events not only
when a message is received from DeviceManager via Kafka, but also when the
module is starting up and then it needs to known which devices are already
configured. It only creates a subscription to the event iotagent-nodejs uses
for device-related events and then asks the library to regenerate all events
based on pre-existing devices.

In order to create a subscription, just check the following example. The
subscritpion is created in `Messenger.on()` calls. Generating an event is also
easy. All it takes is to call `Messenger.emit()` with the following parameters:

- subject: the subject which will be associated to this event;
- tenant: the tenant associated to this event;
- event: the event being generated. This is an arbitrary string. Thus, as long
  as the developer keeps it documentend, it can be anything.
- data: the data associated to the event.

An example of such generation:

```javascript
this.messenger.on(dojotConfig.dojot.subjects.devices, "message", (tenant, msg) => {
    let parsed = null;
    try {
        parsed = JSON.parse(msg);
    } catch (e) {
        console.error("[iota] Device event is not valid json. Ignoring.");
    }
    let eventType = `device.${parsed.event}`;
    this.messenger.emit("iotagent.device", tenant, eventType, parsed);
});
```

This is actually copyied directly from @dojot/iotagent-nodejs code. All it does
is to register a callback for devices subject, parse the content, and emit a new
event, e.g. "device.created", for subject "iotagent.device". So a component
using this library would just create a subscription to this subject:

```javascript
this.messenger.on("iotagent.device", "device.create", (tenant, msg) => {
    console.log(`Device created: ${device.label}`);
});
```