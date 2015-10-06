
// Using STRICT mode for ES6 features
"use strict";


/**
 * Requiring Core Library
 */
var DioscouriCore = require('dioscouri-core');

/**
 * Require Base Front Controller
 *
 * @type {BaseController|exports|module.exports}
 */
var BaseController = require('./basecontroller.js');

var async = require('async');

/**
 *  Index controller
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class Examples extends BaseController {

    /**
     * Initializing controller
     *
     * @param callback
     */
    init (callback) {
        // Registering actions
        this.registerAction('initialize-db', 'initializeDB');
        this.registerAction('post-example', 'getPostInfo');
        this.registerAction('get-info', 'getInfo');
        this.registerAction('authorization-failed', 'failToAuthorize');
        this.registerAction('authorization-failed-redirect', 'failToAuthorizeRedirect');
        this.registerAction('get-users-list', 'getUsersList');
        this.registerAction('send-to-queue', 'sendToQueue');

        // Initialize user model
        this.userModel = require('../models/user.js')

        callback();
    }

    /**
     * Load view file
     *
     * @param dataReadyCallback
     */
    load (dataReadyCallback) {

        // Set page data
        this.data.header = "NodeJS Web";

        /**
         * Set output view object
         */
        this.view(DioscouriCore.View.htmlView('app/views/examples.swig'));

        // Send DATA_READY event
        dataReadyCallback(null);
    }

    /**
     * initializeDB action hndler
     *
     * @param dataReadyCallback
     */
    initializeDB (dataReadyCallback) {

        var userData = { 'name.first': 'Admin', 'name.last': 'User', email: 'user@dioscouri.com', password: '12345678', isAdmin: true };
        this.userModel.insert(userData, function(err, item){
            // Set page data
            this.data.userDetails = item;

            item.comparePassword('admin', function (err, isMatch) {
                console.log("admin password is " + isMatch);
            });

            /**
             * Set output view object
             */
            this.view(DioscouriCore.View.jsonView());

            // Send DATA_READY event
            dataReadyCallback(err);
        }.bind(this));
    }

    /**
     * post-example action hndler
     *
     * @param dataReadyCallback
     */
    getPostInfo (dataReadyCallback) {
        // Set page data
        this.data.username = this.request.body.username;
        this.data.pageId = this.request.body.pageId;

        /**
         * Set output view object
         */
        this.view(DioscouriCore.View.jsonView());

        // Send DATA_READY event
        dataReadyCallback(null);
    }

    /**
     * Load view file
     *
     * @param dataReadyCallback
     */
    getInfo (dataReadyCallback) {
        this.userModel.getAll(function(err, items){
            // Set page data
            this.data.header = "It works!";
            this.data.users = items;

            /**
             * Set output view object
             */
            this.view(DioscouriCore.View.htmlView('app/views/examples.swig'));

            // Send DATA_READY event
            dataReadyCallback(err);
        }.bind(this));
    }

    /**
     * Example how to perform Authorization failure
     * In general this should be done with the init/preLoad/preInit methods
     *
     * @param dataReadyCallback
     */
    failToAuthorize (dataReadyCallback) {

        // Terminating
        this.terminate();

        // Rendering some view
        var data = {header: 'NodeJS Web', variable: 'Dynamic value'}
        var view = DioscouriCore.View.htmlView('app/views/examples-not-authorized.swig', data);
        view.render(this.response);

        // Send DATA_READY event
        dataReadyCallback(null);
    }

    /**
     * Example how to perform Authorization failure
     * In general this should be done with the
     *
     * @param dataReadyCallback
     */
    failToAuthorizeRedirect (dataReadyCallback) {

        // Terminating
        this.terminate();

        // Redirecting
        this.response.redirect('/');

        // Send DATA_READY event
        dataReadyCallback(null);
    }

    /**
     * Example how to queue item
     *
     * @param dataReadyCallback
     */
    sendToQueue(dataReadyCallback) {
        // Example how to create new job task in queue
        var jobObject = {
            workerName: 'test', /// test.js
            commandName: 'uppercase',
            params: {
                text: 'homepage'
            },
            delay: new Date(new Date().getTime() + 1000 * 10),
            priority: 1
        };

        this.queue.enqueue(jobObject);

        /**
         * Set output view object
         */
        this.view(DioscouriCore.View.jsonView(jobObject));

        dataReadyCallback();
    }
};

/**
 * Exporting Controller
 *
 * @type {Function}
 */
exports = module.exports = function(request, response) {
    var controller = new Examples(request, response);
    controller.run();
};
