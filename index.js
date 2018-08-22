module.exports = {
    Logger: require('./lib/log/logger'),
    KafkaConsumer: require('./lib/kafka/Consumer'),
    KafkaProducer: require('./lib/kafka/Producer'),
    Messenger: require("./lib/messenger").Messenger,
    Config: require("./lib/config"),
    Auth: require("./lib/auth"),
};
