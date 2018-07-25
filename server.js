const logger = require('./index');
const express = require('express');

var app = express();

app.get('/setLog', (req, res) => {
    res.send("Level of debugger is set to " + req.query.level);
    logger.transports[0].level = req.query.level;
    logger.debug("debug");
    logger.info("info");
    logger.warn("warn");
    logger.error("error");
}, e => {
      res.status(400).send(e);
  });

  app.listen(3000, () => {
    console.log(`Started up at port 3000`);
  });