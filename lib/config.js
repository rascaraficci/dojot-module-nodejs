/* For tests only */

module.exports={
    kafka: {
        producer: {
            "client.id": "kafka",
            "metadata.broker.list": process.env.KAFKA_HOSTS || "kafka:9092",
            "compression.codec": "gzip",
            "retry.backoff.ms": 200,
            "message.send.max.retries": 10,
            "socket.keepalive.enable": true,
            "queue.buffering.max.messages": 100000,
            "queue.buffering.max.ms": 1000,
            "batch.num.messages": 1000000,
            "dr_cb": true
        },

        consumer: {
            "group.id": process.env.KAFKA_GROUP_ID || "data-broker",
            "metadata.broker.list": process.env.KAFKA_HOSTS || "kafka:9092",
        }
    },
    databroker: {
      host: process.env.DATA_BROKER_URL || "http://data-broker",
    },
    dojot: {
      managementService: process.env.DOJOT_SERVICE_MANAGEMENT || "dojot-management",
      subjects: {
        tenancy: process.env.DOJOT_SUBJECT_TENANCY || "dojot.tenancy",
        devices: process.env.DOJOT_SUBJECT_DEVICES || "dojot.device-manager.device",
        deviceData: process.env.DOJOT_SUBJECT_DEVICE_DATA || "device-data",
        statistics: process.env.DOJOT_SUBJECT_STATISTICS || "dojot.device.statistics",
      }
    }
};