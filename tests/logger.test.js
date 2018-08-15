const dojotLibs = require('../index');
const assume = require('assume');

const express = require('express');
const path = require('path');
const winston = require('winston');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
const sinon = require('sinon');
const SpyTransport = require('@chrisalderson/winston-spy');

chai.use(chaiHttp);


let filename = path.basename(__filename);

//defining log
var logger = dojotLibs.logger;

//defining app express
const app = express();

//setting log debug route to app
dojotLibs.loggerRoute(app, filename);

app.listen(3000, () => {});


describe("Test logger module" , () => {

    describe("Success Route connection" , () => {
        it("tests connection to logger debug route" , (done) => {

            chai.request(app)
            .get('/setLog?level=debug')
            .end((err, res) => {
                res.should.have.status(200);
                res.should.have.header('content-type', 'text/html; charset=utf-8');
                done();
            });
        });
    });


    describe("Error Route connection" , () => {
        it("tests error connection if query is not correctly insert" , (done) => {

            chai.request(app)
            .get('/setLog?level=a')
            .end((err, res) => {
                res.should.have.status(400);
                res.should.have.header('content-type', 'text/html; charset=utf-8');
                done();
            });
        });
    });

    describe("Logger print" , () => {
        const spy = sinon.spy();

        let consoleTransport;
        let transport;
      
        before(() => {
          consoleTransport = new winston.transports.Console({
            silent: true  
          });
          transport = new winston.transports.SpyTransport({ spy });
      

          logger.add(consoleTransport);
          logger.add(transport);
        });
      
        it("tests if logger is called" , () => {
            const info = {
                message: 'foo',
                level: 'info'
              };
              logger.log(info);

          
              assume(spy.calledOnce).true();
              assume(spy.calledWith(info)).true();
        });

        after(() => {
            logger.remove(consoleTransport);
            logger.remove(transport);
        });
    });
});