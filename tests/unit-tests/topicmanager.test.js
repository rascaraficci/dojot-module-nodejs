"use strict";

/**
 * Unit tests for TopicManager module
 *
 * This module has the following dependencies:
 *
 * - axios
 */

const TopicManager = require("../../lib/kafka/TopicManager");
const axios = require("axios");
const config = require("../../lib/config");

//
// Mocking dependencies
//
jest.mock("axios");
jest.mock("../../lib/auth");
jest.useFakeTimers();


describe("Kafka producer", () => {
    var mockConfig = {
        databroker: {
            connectionRetries: 1,
            timeoutSleep: 10
        },
    };

    beforeAll(() => {

    });

    afterEach(() => {
        axios.mockReset();
    });

    afterAll(() => {
        axios.mockRestore();
    });

    describe("TopicManager creation", () => {
        it("should create an empty manager", () => {
            /**
             * This test will check if a TopicManager can be successfully created.
             */
            // >> Tested code
            const tm = new TopicManager(mockConfig);
            const tm2 = new TopicManager();
            // << Tested code

            // >> Results verification
            expect(tm.topics).toEqual({});
            expect(tm.tenants).toEqual([]);
            expect(tm.config).toEqual(mockConfig);
            expect(tm2.topics).toEqual({});
            expect(tm2.tenants).toEqual([]);
            expect(tm2.config).toEqual(config);
            // << Results verification
        });
    });

    describe("Retrieving topics", () => {
        it("should retrieve a topic successfully", (done) => {
            /**
             * This test will check whether the module is able to successfully
             * retrieve a new topic from Data Broker
             */
            axios.mockReturnValue(Promise.resolve({ data: { topic: "sample-topic" } }));

            // >> Tested code
            const tm = new TopicManager(mockConfig);
            tm.topics = {};
            const getTopicPromise = tm.getTopic("sample-subject", "sample-tenant", "sample-broker", false);
            // << Tested code

            // >> Results verification
            getTopicPromise.then((topic) => {
                expect(topic).toEqual("sample-topic");
                expect(axios).toBeCalledWith({
                    url: "sample-broker/topic/sample-subject",
                    method: "get",
                    headers: expect.anything(),
                });
                expect(tm.topics).toEqual({"sample-tenant:sample-subject": "sample-topic"});
                done();
            }).catch((error) => {
                done(`should not raise an error: ${error}`);
            });
            // << Results verification

            // Testing a global subject
            // >> Tested code
            const tm2 = new TopicManager(mockConfig);
            tm2.topics = {};
            const getTopicPromiseGlobal = tm2.getTopic("sample-subject-global", "sample-tenant-global", "sample-broker", true);
            // << Tested code

            // >> Results verification
            getTopicPromiseGlobal.then((topic) => {
                expect(topic).toEqual("sample-topic");
                expect(tm2.topics).toEqual({"sample-tenant-global:sample-subject-global": "sample-topic"});
                expect(axios).toBeCalledWith({
                    url: "sample-broker/topic/sample-subject-global?global=true",
                    method: "get",
                    headers: expect.anything(),
                });
                done();
            }).catch((error) => {
                done(`should not raise an error: ${error}`);
            });
            // << Results verification
        });

        it("should retrieve a topic from cache", (done) => {
            /**
             * This test will check whether TopicManager is able to use its own
             * cache
             */

            // >> Tested code
            const tm = new TopicManager(mockConfig);
            tm.topics = {"sample-tenant:sample-subject": "sample-topic"};
            const getTopicPromise = tm.getTopic("sample-subject", "sample-tenant", "sample-broker", false);
            // << Tested code

            // >> Results verification
            getTopicPromise.then((topic) => {
                expect(topic).toEqual("sample-topic");
                expect(axios).not.toHaveBeenCalled();
                done();
            }).catch((error) => {
                done(`should not raise an error: ${error}`);
            });
            // << Results verification
        });


        it("should deal with unexpected message formats", (done) => {
            /**
             * This test will check whether the module is able deal with
             * malformed responses from Data Broker
             */
            axios.mockReturnValue(Promise.resolve({data: "not-standard"}));

            // >> Tested code
            const tm = new TopicManager(mockConfig);
            tm.topics = {};
            const getTopicPromise = tm.getTopic("sample-subject", "sample-tenant", "sample-broker", false);
            // << Tested code

            // >> Results verification
            getTopicPromise.then(() => {
                done("promise should not be resolved");
            }).catch((error) => {
                expect(error).toEqual("Invalid response from Data Broker: not-standard");
                done();
            });
            // << Results verification
        });

        it("should retry if Data Broker is not yet accessible", (done) => {
            /**
             * This test will check whether the module is able to deal with
             * intermittent failures in Data Broker
             */
            jest.useRealTimers();
            axios.mockReturnValueOnce(Promise.reject("not yet ready")).mockReturnValueOnce(Promise.resolve({ data: { topic: "sample-topic-delayed" } }));

            // >> Tested code
            mockConfig.databroker.connectionRetries = 2;
            mockConfig.databroker.timeoutSleep = 0.01;
            const tm = new TopicManager(mockConfig);
            tm.topics = {};
            var getTopicPromise = tm.getTopic("sample-subject", "sample-tenant", "sample-broker", false);
            // << Tested code

            // >> Results verification
            getTopicPromise.then((topic) => {
                expect(topic).toEqual("sample-topic-delayed");
                expect(tm.topics).toEqual({"sample-tenant:sample-subject": "sample-topic-delayed"});
                expect(axios).toBeCalledWith({
                    url: "sample-broker/topic/sample-subject",
                    method: "get",
                    headers: expect.anything(),
                });
                jest.useFakeTimers();
                done();
            }).catch((error) => {
                jest.useFakeTimers();
                done(`should not raise an error: ${error}`);
            });
            // << Results verification
        });

        it("should reject if Data Broker can't be accessed after a few retries", (done) => {
            /**
             * This test will check whether the module is able to deal with fatal
             * failures in Data Broker
             */
            jest.useRealTimers();
            axios.mockReturnValue(Promise.reject("not yet ready"));

            // >> Tested code
            const tm = new TopicManager(mockConfig);
            tm.topics = {};
            const getTopicPromise = tm.getTopic("sample-subject-reject", "sample-tenant-reject", "sample-broker-reject", false);
            // << Tested code

            // >> Results verification
            getTopicPromise.then(() => {
                jest.useFakeTimers();
                done("should not be resolved.");
            }).catch((error) => {
                jest.useFakeTimers();
                expect(error).toEqual("Could not reach DataBroker.");
                done();
            });
            // << Results verification
        });
    });
});
