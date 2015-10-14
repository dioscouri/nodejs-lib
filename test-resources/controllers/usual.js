
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
class Usual extends DioscouriCore.Controller {

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
        this.data.controller = "Usual";
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
        this.data.controller = "Usual";
        this.data.status = "SUCCESS";

        this.view(DioscouriCore.View.jsonView());

        // Send DATA_READY event
        dataReadyCallback(null);
    }
};

/**
 * Exporting Controller
 *
 * @type {Function}
 */
exports = module.exports = function(request, response) {
    var controller = new Usual(request, response);
    controller.run();
};
