const Consumer = require('../../lib/kafka/Consumer');
const config = require('../../lib/config');
const expect = require('expect');

describe('Create consumer', () => {
    let consumer;

    before((done) => {
        consumer = new Consumer(config, "sample-config");
        done();
    });

    it("should create a valid consumer", () => {
        expect(consumer).toBeTruthy();
    });

    describe('Connecting/Disconnecting consumer', () => {
        it("should connect consumer successfully.", (done) => {
            consumer.connect().then(() => {
                console.log("Consumer successfully connected. Disconnecting it.");
                consumer.disconnect().then(() => {

                    done();
                }).catch((error) => {
                    console.log(`Error: ${error}`);
                    done(error);
                });
            }).catch((error) => {
                console.log(`Error: ${error}`);
                done(error);
            });
        });
    });
});

