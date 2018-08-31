const dojot = require('../lib/messenger');
const config = require('../lib/config');
const expect = require('expect');
const auth = require('../lib/auth');

describe('Create messenger', () => {

    let messenger;

    beforeEach(() => {
        messenger = new dojot.Messenger("sample");
    });

    it('get tenant returned by auth', (done) => {
        auth.getTenants(config.auth.host).then(tenant => {
            expect(tenant).toEqual(['admin']);
            done();
        })
    })

    it("Connect producer and consumer for messenger", () => {
        expect(messenger.producer).toBeDefined();
        expect(messenger.consumer).toBeDefined();
    });

    it("Should get tenants", () => {
        messenger.emit('dojot.tenancy', 'admin', 'message', JSON.stringify({ tenant: 'test' }));
        expect(messenger.tenants.length).toBeGreaterThan(0);
        expect(messenger.tenants[0]).toEqual('test');
    });

    it("Should get correct topics", (done) => {
        messenger.topicManager.getTopic('dojot-tenancy', 'dojot-management', config.databroker.host, true).then(topic => {
            expect(topic).toBeDefined();
            done();

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

    afterEach((done) => {
        messenger.producer.disconnect().then(() => {
            messenger.consumer.disconnect().then(() => {
                done();
            })
        });
    });
});