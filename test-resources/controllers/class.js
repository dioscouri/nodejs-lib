
// Using STRICT mode for ES6 features
"use strict";


/**
 * Requiring Core Library
 */
var DioscouriCore = require('../../index.js');

/**
 *  Test Class Controller
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class ClassTestController extends DioscouriCore.Controller {

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
        this.data.controller = "Class";
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
};

/**
 * Exporting Controller
 *
 * @type {Function}
 */
exports = module.exports = ClassTestController;
