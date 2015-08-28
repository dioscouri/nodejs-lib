
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring DotEnv and get configuration for the project
 */
require('dotenv').load({silent: true});
require('dotenv').config({
    path: './config/env/' + process.env.APPLICATION_ENV
});

/**
 *  Base Application configuration
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class Configuration {
    constructor () {
        this._configuration = process.env;
        // console.log(this._configuration);
    }

    /**
     * Get configuration values
     *
     * @returns {*}
     */
    get env () {
        return this._configuration;
    }

    /**
     * Merge config values
     *
     * @param config
     */
    mergeConfig (config) {
        for (var key in config) {
            if (!(config[key] instanceof Function)) {
                this._configuration[key] = config[key];
            }
        }
    }

    /**
     * Check debug flag
     *
     * @returns {Boolean}
     */
    get isDebug () {
        return (this._configuration.ENV_TYPE == 'dev') || (this._configuration.ENV_TYPE == 'qa');
    }

    /**
     * Check is curren Environment is Dev
     *
     * @returns {Boolean}
     */
    get isDev () {
        return (this._configuration.ENV_TYPE == 'dev');
    }

    /**
     * Check is curren Environment is QA
     *
     * @returns {Boolean}
     */
    get isQA () {
        return (this._configuration.ENV_TYPE == 'qa');
    }
}

module.exports.Configuration = Configuration;
