
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring Core Library
 */
var DioscouriCore = require('dioscouri-core');

/**
 * Requiring application Facade
 */
var applicationFacade = DioscouriCore.ApplicationFacade.instance;

/**
 *  Base application controller
 *
 *  @author Eugene Kalosha <ekalosha@dioscouri.com>
 */
class BaseController extends DioscouriCore.Controller {
    /**
     * Controller constructor
     */
    constructor (request, response) {
        // We must call super() in child class to have access to 'this' in a constructor
        super(request, response);

        /**
         * Queue jobs instance
         * @type {Queue}
         * @private
         */
        this._queue = applicationFacade.queue;
    }

    /**
     * Return Queue instance
     *
     * @returns {Queue}
     */
    get queue () {
        return this._queue;
    }
};

/**
 * Exporting Controller
 *
 * @type {Function}
 */
exports = module.exports = BaseController;
