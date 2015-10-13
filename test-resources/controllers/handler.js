
// Using STRICT mode for ES6 features
"use strict";


/**
 * Requiring Core Library
 */
var DioscouriCore = require('../../index.js');

/**
 *  Test Usual Controller
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class Handler extends DioscouriCore.Controller {

    /**
     * Initializing controller
     *
     * @param callback
     */
    init (callback) {
        // Registering actions
        this.registerAction('action-one', 'loadActionOne');

        callback();
    }

    /**
     * Load view file
     *
     * @param dataReadyCallback
     */
    load (dataReadyCallback) {

        // Set page data
        this.data.controller = "Handler";
        this.data.status = "SUCCESS";

        this.view(DioscouriCore.View.jsonView());

        // Send DATA_READY event
        dataReadyCallback(null);
    }

    /**
     * Load view file
     *
     * @param dataReadyCallback
     */
    loadActionOne (dataReadyCallback) {

        // Set page data
        this.data.status = "SUCCESS";

        this.view(DioscouriCore.View.jsonView());

        // Send DATA_READY event
        dataReadyCallback(null);
    }

    /**
     * Implementation of controller handler for Express-like modules
     *
     * @param request
     * @param response
     */
    static controllerHandler (request, response) {
        var controller = new Handler(request, response);
        controller.run();
    }
};

/**
 * Exporting Controller
 *
 * @type {Function}
 */
exports = module.exports = Handler;
