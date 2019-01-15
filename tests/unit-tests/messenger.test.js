const dojot = require('../../lib/messenger');
const config = require('../../lib/config');
const expect = require('expect');
const auth = require('../../lib/auth');

describe('Create messenger', () => {

    let messenger;

    before((done) => {
        messenger = new dojot.Messenger("sample");
        messenger.init().then(() => {
            done();
        }).catch((error) => {
            console.log(`Error: ${error}`);
            done(error);
        });
    });

    it('should retrieve tenants from auth service', (done) => {
        auth.getTenants(config.auth.url).then(tenant => {
            expect(tenant).toEqual(['admin']);
            done();
        }).catch((error) => {
            console.log(`Error: ${error}`);
            done(error);
        });
    });

    it("should create valid producer and consumer", () => {
        expect(messenger.producer).toBeDefined();
        expect(messenger.consumer).toBeDefined();
    });

    it("should retrieve tenants from Kafka", (done) => {
        messenger.emit('dojot.tenancy', 'admin', 'message', JSON.stringify({ tenant: 'test' }));
        expect(messenger.tenants.length).toBeGreaterThan(0);
        console.log(messenger.tenants);
        expect(messenger.tenants).toContain('test');
        messenger._tenancyConsumer.disconnect();
        messenger.consumer.disconnect();
        done();
    });

    it("Should get correct topics", (done) => {
        messenger.topicManager.getTopic('dojot-tenancy', 'dojot-management', config.databroker.url, true).then(topic => {
            expect(topic).toBeDefined();
            done();
        }).catch((error) => {
            console.log(`Error: ${error}`);
            done(error);
        });
    })

    it("Emiting and receiving a message", (done) => {
        messenger.on("iotagent-info", "message", (tenant, msg) => {
            console.log(tenant);
            expect(tenant).toEqual('admin');
            expect(msg).toEqual('test');
            done();
        });

        messenger.emit('iotagent-info', 'admin', 'message', 'test');
    });

});