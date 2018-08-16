/* For tests only */

module.exports={
    kafka: {
        producer: {
            'client.id': 'kafka',
            'metadata.broker.list': "localhost:9092",
            'compression.codec': 'gzip',
            'retry.backoff.ms': 200,
            'message.send.max.retries': 10,
            'socket.keepalive.enable': true,
            'queue.buffering.max.messages': 100000,
            'queue.buffering.max.ms': 1000,
            'batch.num.messages': 1000000,
            'dr_cb': true
        },

        consumer: {
            'group.id': 'kafka',
            'metadata.broker.list': 'localhost:9092'
        }
    },
    databroker: {
      host: "http://localhost:8005"
    }
}