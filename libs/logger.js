/*Dojot Logger Library*/

const winston = require('winston');
const moment = require('moment');
const express = require('express');
const { combine, printf, timestamp, colorize} = winston.format;

/*Setting timestamp*/
moment.locale('pt-br');

/* Levels of debug */
let debugLevels = ['debug', 'info', 'warn', 'error'];

function formatParams(info) {
    const { timestamp, level, message, ...args } = info;
    const ts = timestamp.slice(0, 19).replace("T", " ");

    const filename = Object.keys(args).length? args.filename : "";
  
    return `<${ts}> -- |${filename}| -- ${level}: ${message}`;
}

/**
 * @description This log module allows the developer to create usefull logs
 * messages with a certain level of severity. This module will work with four
 * levels of logging, wich are dividide into:
 * 
 * ERROR: This level serves as the general error feature. 
 * It should be used whenever the software encounters an unexpected error that prevents further processing
 * (e.g. cant connect to a port, an error connecting with kafka, a connection refused).
 * 
 * WARN: Events that are likely to lead to an error in the future, however, can be corrected by the system runtime
 * (e.g. a fail connection with database, fail trying to retrieve a data, fail trying to get a callback)
 * 
 * INFO: System update information events (e.g A new socket connection, a new kafka producer).
 * 
 * DEBUG: Events for debug readings, usefull when developers are trying to understand the code (e.g. Kafka Producer is not yet ready,
 * Retrieving/creating new topic).
 * 
 * The level severity of logs can be changed via runtime by a http request into: '.../setLog?level={level of your debug}'.
 * This modules provides a route via express routes for runtime log level change.
 * 
 * an example to create a customized logger:
 * logger.debug("Will initialize ingestion handler device-data at topic f968b47f-6db7-4434-9e9c-175feb42c68b", {filename: "your module name"})
 * 
 * the response will be:
 * <19:48:14 02/08/2018> -- |your module name| -- DEBUG: Will initialize ingestion handler device-data at topic f968b47f-6db7-4434-9e9c-175feb42c68b.
 */
  
const logger = winston.createLogger({
    format: combine(
        winston.format(info => {
            info.level= info.level.toUpperCase();
            return info;
        })(),
        timestamp({format: 'HH:mm:ss DD/MM/YYYY'}),
        colorize({all:true}),
        winston.format.printf(formatParams)
    ),
    transports: [
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true
        })
    ],
    exitOnError: false
});

/*Route to runtime debug change*/
const loggerRoute = function(app, filename){
    app.get('/setLog', (req, res) => {
        if (req.query.level && (debugLevels.indexOf(req.query.level) >= 0)) {
            res.set(200).send("Level of debugger is set to " + req.query.level);
            logger.transports[0].level = req.query.level;
        } else {
            res.status(400).send("undefined level of debugger");
        }
    });

}


module.exports = {logger, loggerRoute};
