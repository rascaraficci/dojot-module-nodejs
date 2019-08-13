/**
 * Unit Test for Messenger Module
 * 
 * This module has the following dependencies:
 * 
 * - axios (from axios)
 */

const Messenger = require("../../lib/messenger").Messenger;
const axios = require("axios");

/**
 * Mocking dependencies
 */
jest.mock("axios");
jest.mock("../../lib/kafka/Producer");
jest.mock("../../lib/kafka/Consumer");

jest.mock("../../lib/kafka/TopicManager");

jest.mock("../../lib/auth", () => ({
  getTenants: jest.fn(() => { return Promise.resolve(['test', 'test', 'test1', 'test2'])})
}));

const config = require("../../lib/config");

/* Kafka mock */
const Kafka = {
  producerMock: {
    connect: jest.fn(() => {return Promise.resolve()}),
    disconnect: jest.fn(),
    flush: jest.fn(),
    on: jest.fn(),
    poll: jest.fn(),
    produce: jest.fn(),
    setPollInterval: jest.fn(),
  },

  consumerMock: {
    commit: jest.fn(),
    connect: jest.fn(() => {return Promise.resolve()}),
    consume: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    subscribe: jest.fn((arg0, callback) => { callback('message') }),
    unsubscribe: jest.fn(),
  }
}

jest.useFakeTimers();

describe("Kafka Producer", () => {

  

  const mockConfig = config;

  beforeAll(() => {
    jest.useFakeTimers()
  })


  beforeEach(() => {
    axios.mockReset();
  })

  afterAll(() => {
    axios.mockRestore();
    jest.useRealTimers()
  })

  describe("Messenger creation", () => {

    it("should create an empty messenger", () => {
      /**
       * This test should create an empty messenger 
       * without initializing and process callbacks
       */
    
      // >> Tested code
      const messenger = new Messenger("Test-messenger");
      // << Tested code
  
      // >> Results verification
      expect(messenger.topicManager).toBeDefined();
      expect(messenger.eventCallbacks).toEqual({});
      expect(messenger.subjects).toEqual({});
      expect(messenger.topics).toEqual([]);
      expect(messenger.producerTopics).toEqual({});
      expect(messenger.globalSubjects).toEqual({});
      expect(messenger.queuedMessages).toEqual([]);
      // << Results verification
    })  
  })

  describe("Messenger initialization", () => {
    it("should initialize a messenger sucessfully", () => {
      /**
       * This test should initialize a messenger 
       * and it's components (consumer) sucessfully 
       */

      // >> Tested code
      const messenger = new Messenger("Test-messenger", mockConfig);
      messenger.producer = Kafka.producerMock
      messenger.consumer = Kafka.consumerMock
      messenger._tenancyConsumer = Kafka.consumerMock

      messenger._initTenancyConsumer = jest.fn(() => {Promise.resolve()})
      
      messenger.init().then(() => {
        // >> Results verification
        expect(messenger.producer.connect).toHaveBeenCalled();    
        expect(messenger.consumer.connect).toHaveBeenCalled();    
        expect(messenger._tenancyConsumer.connect).toHaveBeenCalled();    
        // << Results verification
      });
      // << Tested code
    })


    it("should initialize fail", async () => {
      /**
       * This test should fail on messenger initialization
       */
    
       // >> Tested code
      Kafka.producerMock.connect = jest.fn(() => { return Promise.reject()} );
      Kafka.consumerMock.connect = jest.fn(() => { return Promise.reject()} );
      
      const messenger = new Messenger("Test-messenger", mockConfig);
      
      messenger.producer = Kafka.producerMock
      messenger.consumer = Kafka.consumerMock
      messenger._tenancyConsumer = Kafka.consumerMock
      // << Tested code

      // >> Tested code
      messenger.init().catch(() => {
        // << Results verification
        expect(messenger.producer.connect).toHaveBeenCalledTimes(mockConfig.kafka.dojot.connectionRetries);
        // << Results verification
      })
      // << Tested code
    })
  })

})

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

describe("Testing tenancy consumer init", () => {

  it("should register tenancy sucessfully", async () => {

    // >> Tested code
    const messenger = new Messenger("Test-messenger", config);
    messenger.topicManager.getTopic = jest.fn(() => {return Promise.resolve('test')});

    messenger.producer = Kafka.producerMock
    messenger.consumer = Kafka.consumerMock
    messenger._tenancyConsumer = Kafka.consumerMock
    messenger._processKafkaMessages = jest.fn()

    await messenger._initTenancyConsumer();

    expect(messenger.topics[0]).toEqual('test');

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
