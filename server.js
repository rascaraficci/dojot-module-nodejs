const dojotLibs = require('./index');
const express = require('express');
const path = require('path');

let filename = path.basename(__filename);


//defining log
var logger = dojotLibs.logger;

//defining app express
const app = express();

//setting log debug route to app
dojotLibs.loggerRoute(app, filename);



app.listen(3000, () => {
console.log(`Started up at port 3000`);
});