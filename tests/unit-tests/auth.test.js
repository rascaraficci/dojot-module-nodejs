"use strict";

/**
 * Unit tests for Auth module
 *
 * This module has the following dependencies:
 *
 * - axios
 */

const Auth = require("../../lib/auth");
const axios = require("axios");
const config = require("../../lib/config");

//
// Mocking dependencies
//
jest.mock("axios");
jest.useFakeTimers();


describe("Kafka producer", () => {
    var mockConfig = {
        auth: {
            connectionRetries: 1,
            timeoutSleep: 10
        },
        dojot: {
            management: {
                tenant: "sample-tenant"
            }
        }
    };

    beforeAll(() => {

    });

    afterEach(() => {
        axios.mockReset();
    });

    afterAll(() => {
        axios.mockRestore();
    });

    describe("Retrieving tenants", () => {
        it("should retrieve a list of tenants successfully", (done) => {
            /**
             * This test will check whether the module is able to successfully
             * retrieve a new topic from Data Broker
             */
            axios.mockReturnValue(Promise.resolve({ data: { tenants: ["sample-tenant"] } }));

            // >> Tested code
            const getTenantsPromise = Auth.getTenants("sample-service", mockConfig);
            // << Tested code

            // >> Results verification
            getTenantsPromise.then((tenants) => {
                expect(tenants).toEqual(["sample-tenant"]);
                expect(axios).toBeCalledWith({
                    url: "sample-service/admin/tenants",
                    method: "get",
                    headers: expect.anything(),
                });
                done();
            }).catch((error) => {
                done(`should not raise an error: ${error}`);
            });
            // << Results verification
        });

        it("should retrieve a list of tenants successfully with default config", (done) => {
            /**
             * This test will check whether the module is able to successfully
             * retrieve a new topic from Data Broker
             */
            axios.mockReturnValue(Promise.resolve({ data: { tenants: ["sample-tenant-default"] } }));

            // >> Tested code
            const getTenantsPromise = Auth.getTenants("sample-service-default");
            // << Tested code

            // >> Results verification
            getTenantsPromise.then((tenants) => {
                expect(tenants).toEqual(["sample-tenant-default"]);
                expect(axios).toBeCalledWith({
                    url: "sample-service-default/admin/tenants",
                    method: "get",
                    headers: expect.anything(),
                });
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
            const getTenantsPromise = Auth.getTenants("sample-service", mockConfig);
            // << Tested code

            // >> Results verification
            getTenantsPromise.then(() => {
                done("promise should not be resolved");
            }).catch((error) => {
                expect(error).toEqual(`Invalid message from Auth: not-standard`);
                done();
            });
            // << Results verification
        });

        it("should retry if Auth is not yet accessible", (done) => {
            /**
             * This test will check whether the module is able to deal with
             * intermittent failures in Data Broker
             */
            jest.useRealTimers();
            mockConfig.auth.connectionRetries = 2;
            mockConfig.auth.timeoutSleep = 0.01;
            axios.mockReturnValueOnce(Promise.reject("not yet ready")).mockReturnValueOnce(Promise.resolve({ data: { tenants: ["sample-tenant-delayed"] } }));

            // >> Tested code
            const getTenantsPromise = Auth.getTenants("sample-service", mockConfig);
            // << Tested code

            // >> Results verification
            getTenantsPromise.then((tenants) => {
                expect(tenants).toEqual(["sample-tenant-delayed"]);
                expect(axios).toBeCalledWith({
                    url: "sample-service/admin/tenants",
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
            const getTenantsPromise = Auth.getTenants("sample-service", mockConfig);
            // << Tested code

            // >> Results verification
            getTenantsPromise.then(() => {
                jest.useFakeTimers();
                done("should not be resolved.");
            }).catch((error) => {
                jest.useFakeTimers();
                expect(error).toEqual("Could not reach Auth.");
                done();
            });
            // << Results verification
        });
    });
});
