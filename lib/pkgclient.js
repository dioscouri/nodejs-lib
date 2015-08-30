
// Using STRICT mode for ES6 features
"use strict";

/**
 *  Class that implements pkg cloud API
 */
class PkgClient {

    /**
     * Constructor
     *
     */
    constructor () {

        /**
         * Global config
         *
         * @private
         */
        this._config = require('./facade.js').ApplicationFacade.instance.config;

        /**
         * Pkg Cloud client
         *
         * @private
         */
        this._client = require('pkgcloud').storage.createClient({
            provider: this._config._configuration.pkgcloud.provider,
            username: this._config._configuration.pkgcloud.userName,
            apiKey: this._config._configuration.pkgcloud.apiKey,
            region: this._config._configuration.pkgcloud.region
        });
    }

    /**
     * Return a client
     *
     */
    get client () {
        return this._client;
    }
}

/**
 * Exporting view classes
 */
module.exports = PkgClient;
