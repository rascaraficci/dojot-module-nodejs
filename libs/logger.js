/*Dojot Logger Library*/

const winston = require('winston');
const moment = require('moment');
const express = require('express');
const path = require('path');
const { combine, printf, timestamp, colorize} = winston.format;

/*Setting timestamp*/
moment.locale('pt-br');


/* Levels of debug */
let debugLevels = ['debug', 'info', 'warn', 'error'];

/*Logs print format*/
var myFormat = printf(info => {
    return `<${info.timestamp}> ${info.level}: ${info.message}`;
});

/*Instance logging*/
const logger = winston.createLogger({
    format: combine(
        winston.format(info => {
            info.level= info.level.toUpperCase();
            return info;
        })(),
        timestamp({format: 'HH:mm:ss DD/MM/YYYY'}),
        colorize(),
        myFormat
    ),
    transports: [
        new winston.transports.Console({
            name: 'meu nome',
            level: 'debug',
            handleExceptions: true
        })
    ],
    exitOnError: false
});

/*Route to runtime debug change*/
const loggerRoute = function(app){
    app.get('/setLog', (req, res) => {
        if (req.query.level && (debugLevels.indexOf(req.query.level) >= 0)) {
            res.set(200).send("Level of debugger is set to " + req.query.level);
            logger.transports[0].level = req.query.level;
            logger.debug("debug", {session: 'test'});
            logger.info("info");
            logger.warn("warn");
            logger.error("error");
        } else {
            res.status(400).send("undefined level of debugger");
        }
    });

}


module.exports = {logger, loggerRoute};
