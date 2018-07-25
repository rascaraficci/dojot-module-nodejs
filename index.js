const winston = require('winston');
const moment = require('moment');
const { combine, printf, colorize } = winston.format;

moment.locale('pt-br');
const timestamp =  moment().format('HH:mm:ss DD/MM/YYYY');

const myFormat = printf(info => {
    return `<${timestamp}> ${info.level}: ${info.message}`;
});


const logger = winston.createLogger({
    format: combine(
        colorize(),
        myFormat
    ),
    transports: [
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true
        })
    ],
    exitOnError: false
    });
    
module.exports = logger;
