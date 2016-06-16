// Using STRICT mode for ES6 features
"use strict";

/**
 * Require base event emitter abstraction
 *
 * @type {*}
 */
const EventEmitter = require('events');

/**
 * Base email provider object
 *
 * @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class EmailProvider extends EventEmitter {

    /**
     * Provider constructor
     */
    constructor (settings) {
        // Call super to define link to this
        super();

        // Init field with default values
        this._settings = {};
        this._client = null;

        /**
         * Requiring system logger
         *
         * @type {Logger|exports|module.exports}
         * @private
         */
        this._logger = require('./../logger.js');

        if (settings) {
            this.settings = settings;
        }
    }

    /**
     * Getter for provider implementation. Usually instance of source email library.
     */
    get client () {
        return this._client;
    }

    /**
     * Getter for settings.
     */
    get settings () {
        return this._settings;
    }

    /**
     * Setter for settings.
     */
    set settings (value) {
        if (value != null) {
            this._settings = value;
        }
    }

    /**
     * Made class abstract
     *
     * @returns Promise
     */
    send (message, callback) {
        throw new Error("Send method is not implemented!");
    }
}

// Event definition
EmailProvider.BEFORE_SEND = "BEFORE_SEND";

/**
 * Export abstract email provider
 *
 * @type {EmailProvider}
 */
module.exports = EmailProvider;
