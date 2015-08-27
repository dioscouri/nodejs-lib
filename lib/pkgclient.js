
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
         * Read configuration
         *
         * @private
         */
        this._config = require('../app/models/common/configuration').conf;

        /**
         * Pkg Cloud client
         *
         * @private
         */
        this._client = require('pkgcloud').storage.createClient({
            provider: this._config['pkgcloud'].provider,
            username: this._config['pkgcloud'].userName,
            apiKey: this._config['pkgcloud'].apiKey,
            region: this._config['pkgcloud'].region
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
