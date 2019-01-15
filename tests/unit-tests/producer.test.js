const Producer = require('../../lib/kafka/Producer');
const config = require('../../lib/config');
const expect = require('expect');

describe("Creating producer", () => {

    let producer;

    beforeEach(() => {
        producer = new Producer(config.kafka.consumer);
    });

    it("Initing producer", (done) => {
        expect(producer).toBeTruthy();
        done();
    });

    describe("Connecting/Disconnecting producer", () => {
        it("Successful connecting and disconnecting the producer", (done) => {
            producer.connect().then(() => {

                producer.disconnect().then(() => {
                    done();
                });
            });
        });
    });

    describe("produce", () => {
        it("Produce result as given parameter", () => {
            const message = Buffer.from("message");
            const key = Buffer.from("key");

            producer.connect().then(async () => {
                await producer.produce("test-topic", message, key);

                runCallback(["test-topic", messsage, key, reject, resolve]);

                producer.disconnect().then(() => {
                    done();
                });

            });
        });
        function runCallback(producerParams) {
            resolveOnDeliveryReport(null, { opaque: { callback: producerParams[5].callback } });
        }
    });

});