
// Using STRICT mode for ES6 features
"use strict";

// Requiring core assert
var assert = require('assert');

/**
 * Requiring init script for main nodejs-lib
 *
 * @type {exports|module.exports}
 * @private
 */
var _init = require('./common/_init.js');

/**
 * Requiring path utils
 * @type {*}
 */
var path = require('path');

/**
 * Requiring request library
 *
 * @type {request|exports|module.exports}
 */
var request = require('request');

// Requiring main nodejs-core lib
var DioscouriCore = require('../index.js');

describe('HTTPServer', function () {

    before(function(done){
        // Set max timeout to 5 sec. As it may take more then 2 secs to run host server
        this.timeout(5000);

        _init.startServer(function (error) {
            if (error == null) {
                done();
            }
        })
    });

    // Describing initial loading
    describe('init', function () {

        // Controllers initialization test
        it('Checking server is initialized', function (done) {
            assert.notEqual(DioscouriCore.ApplicationFacade.instance.server, null);

            done();
        });

    });

    // Controllers
    describe('Controllers', function () {

        // Controllers initialization test
        it('Checking Usual Controller', function (done) {
            var url = 'http:' + DioscouriCore.ApplicationFacade.instance.config.env.BASE_URL + '/test-controller-usual';
            request(url, function (error, response, body) {
                var responseJSON = null;
                if (!error && response.statusCode == 200) {
                    responseJSON = JSON.parse(body);
                }

                assert.equal(error, null);
                assert.notEqual(responseJSON, null);
                assert.equal(responseJSON.controller, 'Usual');
                assert.equal(responseJSON.status, 'SUCCESS');

                done();
            })
        });
        it('Checking Class Controller', function (done) {
            var url = 'http:' + DioscouriCore.ApplicationFacade.instance.config.env.BASE_URL + '/test-controller-class';
            request(url, function (error, response, body) {
                var responseJSON = null;
                if (!error && response.statusCode == 200) {
                    responseJSON = JSON.parse(body);
                }

                assert.equal(error, null);
                assert.notEqual(responseJSON, null);
                assert.equal(responseJSON.controller, 'Class');
                assert.equal(responseJSON.status, 'SUCCESS');

                done();
            })
        });
        it('Checking Handler Controller', function (done) {
            var url = 'http:' + DioscouriCore.ApplicationFacade.instance.config.env.BASE_URL + '/test-controller-handler';
            request(url, function (error, response, body) {
                var responseJSON = null;
                if (!error && response.statusCode == 200) {
                    responseJSON = JSON.parse(body);
                }

                assert.equal(error, null);
                assert.notEqual(responseJSON, null);
                assert.equal(responseJSON.controller, 'Handler');
                assert.equal(responseJSON.status, 'SUCCESS');

                done();
            })
        });

    });
});
