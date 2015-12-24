
// Using STRICT mode for ES6 features
"use strict";

global.DEFAULT_CONFIG_PATH = '.env-test';

var DioscouriCore = require('../../index.js');

/**
 * Requiring Async operations helper
 *
 * @type {async|exports|module.exports}
 */
var async = require('async');

/**
 * Requiring system path helper
 */
var path = require('path');

/**
 *  Importing Application Facade and run the Application.
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
var applicationFacade = DioscouriCore.ApplicationFacade.instance;

function startAppServer (callback) {
    if (global.appServerInitializationRequested == null) {

        global.appServerInitializationRequested = true;

        console.log('Initializing application server');

        applicationFacade.on(DioscouriCore.ApplicationEvent.MONGO_CONNECTED, function (event) {
            var locals = {};
            console.log('Checking initial data for test environment');
            async.series([
                    function (asyncCallback){
                        asyncCallback();
                    },
                    function (asyncCallback){
                        asyncCallback();
                    }
                ],
                function (error) {
                    if (error != null) {
                        console.error('ERROR. Failed to initialize test environment. ', error.message);
                    }
                    callback(error);
                });

        }.bind(applicationFacade));

        // Initializing server module
        applicationFacade.load('server', DioscouriCore.HTTPServer);

        // Initializing all modules
        applicationFacade.init();

        var testResourcesPath = path.resolve(__dirname + '/../../test-resources');
        applicationFacade.server.loadRoutes(testResourcesPath + '/routes', testResourcesPath + '/controllers');

        /**
         * Loading applications
         */
        // applicationFacade.loadApplications('module-test-config.json');

        applicationFacade.run();
    } else {
        callback();
    }
}


module.exports = {
    startServer: startAppServer
}
