/*Dojot Logger Library*/
const winston = require('winston');
const { combine, timestamp, colorize} = winston.format;

/* Levels of debug */
let debugLevels = ['debug', 'info', 'warn', 'error'];

function formatParams(info) {
    const { timestamp, level, message, ...args } = info;
    const ts = timestamp.slice(0, 19).replace("T", " ");

    const filename = Object.keys(args).length? args.filename : "";
  
    return `<${ts}> -- |${filename}| -- ${level}: ${message}`;
}
  
/*Instance logging*/
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
