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

describe("Testing tenant callback function", () => {
  
  it("should add a new tenant to cache then remove it", () => {
    const messenger = new Messenger("Test-Mesenger")
    
    // test create
    const newTenant = { type: "CrEaTe", tenant: "messenger" };
    messenger._processTenantCallback("messenger.tenant", JSON.stringify(newTenant));
    expect(messenger.tenants.length).toEqual(1);
    messenger._processTenantCallback("messenger.tenant", JSON.stringify(newTenant));
    expect(messenger.tenants.length).toEqual(1);

    // test delete
    newTenant.type = "dELETe";
    messenger._processTenantCallback("messenger.tenant", JSON.stringify(newTenant));
    expect(messenger.tenants.length).toEqual(0);
    messenger._processTenantCallback("messenger.tenant", JSON.stringify(newTenant));
    expect(messenger.tenants.length).toEqual(0);

    newTenant.type = "do-nothing";
    messenger._processTenantCallback("messenger.tenant", JSON.stringify(newTenant));
    expect(messenger.tenants.length).toEqual(0);

    // errors
    const badJSONString = "{},"
    messenger._processTenantCallback("messenger.tenant", badJSONString);
    expect(messenger.tenants.length).toEqual(0);

    const emptyJSONString = `{"tenant":"jonas"}`
    messenger._processTenantCallback("messenger.tenant", emptyJSONString);
    expect(messenger.tenants.length).toEqual(0);
  })  
})
