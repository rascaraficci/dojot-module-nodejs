const Consumer = require('../../lib/kafka/Consumer');
const config = require('../../lib/config');
const expect = require('expect');

describe('Create consumer', () => {
    let consumer;

    beforeEach(() => {
        consumer = new Consumer(config.kafka.consumer);
    });

    it("Initiate consumer", () => {
        return expect(consumer).toBeTruthy();
    });

    describe('Connecting/Disconnecting consumer', () => {
        it("Successful connecting the consumer", (done) => {
            consumer.connect().then(() => {
                consumer.disconnect().then(() => { done() });
            });
        });
    });

    describe('Consume!', () => {
        it("Succesful consume a message", (done) => {
            const messages = 5;
            consumer.connect().then(() => {

                consumer.consume(messages).then(() => {
                    consumer.disconnect().then(() => { done() });
                })
            });
        });
    });
});

