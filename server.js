const dojotLibs = require('./index');
const express = require('express');

//defining log
var logger = dojotLibs.logger;

//defining app express
const app = express();

//setting log debug route to app
dojotLibs.loggerRoute(app);



app.listen(3000, () => {
console.log(`Started up at port 3000`);
});