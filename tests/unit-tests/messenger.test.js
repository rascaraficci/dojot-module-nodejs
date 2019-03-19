const Messenger = require("../../lib/messenger").Messenger;


describe("Testing messenger on method", () => {

  it("Should add callback", () => {
    const messenger = new Messenger("Test-Messenger")
    messenger.on("device-data", "message", "myCallBack", "12345")
    expect(messenger.eventCallbacks['device-data']['message']['12345']).toEqual('myCallBack');
  })

  it("Should add callback and return callback ID", () => {
    const messenger = new Messenger("Test-Messenger")
    let callbackId = messenger.on("device-data", "message", "myCallBack")
    expect(messenger.eventCallbacks['device-data']['message']).toBeDefined();
    expect(callbackId).toBeDefined();
  })

})

describe("Testing messenger unregister method", () => {

  it("should unregister callback", () => {
    const messenger = new Messenger("Test-Messenger")
    messenger.eventCallbacks['device-data'] = {}
    messenger.eventCallbacks['device-data']['message'] = {}
    messenger.eventCallbacks['device-data']['message']['12345'] = "myCallBack"

    messenger.unregisterCallback("device-data", "message", "12345")
    expect(messenger.eventCallbacks['device-data']['message']['12345']).toBeUndefined();

  })
  
})