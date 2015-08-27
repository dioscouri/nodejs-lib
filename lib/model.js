
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring core Events module
 */
var events = require('events');

/**
 *  Base Model
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class Model extends events.EventEmitter {

    /**
     * Model constructor
     */
    constructor () {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

        /**
         * Requiring system logger
         *
         * @type {Logger|exports|module.exports}
         * @private
         */
        this._logger = require('./logger.js');
    }

};

/**
 * Exporting Model Classes and Events
 */
module.exports.Model = Model;
