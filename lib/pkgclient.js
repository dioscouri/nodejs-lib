
// Using STRICT mode for ES6 features
"use strict";

/**
 * Async events execution
 */
var async = require('async');

/**
 * Random string generation
 */
var rs = require('randomstring');

/**
 * File systems module
 */
var fs = require('fs');

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

    /**
     * Upload item to the specified container, create container if it's not exist
     *
     * @param {string} file - Local file path
     * @param {Object} options - Upload options.
     * @param {string} options.fileName - File name.
     * @param {string} options.containerName - Container name.
     * @param {boolean} options.containerCdn - Should container use CDN or not.
     * @param {function} callback - Callback function.
     */
    upload(file, options, callback) {

        async.waterfall([function (callback) {

            this.client.getContainer(options.containerName, function (err, container) {

                if (err) {
                    if (err.statusCode == 404) {
                        /**
                         * Container not found
                         */
                        return callback(null, null);
                    }

                    return callback(err);
                }

                callback(null, container);
            });

        }.bind(this), function (container, callback) {

            if (container) {
                callback(null, container);
            } else {
                this.client.createContainer({
                    name: options.containerName
                }, callback);
            }

        }.bind(this), function (container, callback) {

            if (!container.cdnEnabled && options.containerCdn) {
                container.enableCdn(function (err) {
                    callback(err, container);
                }.bind(this));
            } else {
                callback(null, container);
            }

        }.bind(this), function (container, callback) {

            /**
             * Create a read stream for our source file
             */
            var source = fs.createReadStream(file);

            /**
             * Remote file name, MUST be unique
             * @type {string}
             */
            var remoteFileName = options.fileName ? rs.generate(5) + '_' + options.fileName : rs.generate(20)

            /**
             * Create a writable stream for our destination
             */
            var dest = this.client.upload({
                container: options.containerName,
                remote: remoteFileName
            });

            dest.on('error', callback);

            dest.on('success', function (remoteFile) {
                callback(null, container, remoteFile);
            }.bind(this));

            /**
             * Pipe the source to the destination
             */
            source.pipe(dest);

        }.bind(this), function (container, remoteFile, callback) {

            /**
             * Obtain CDN url
             */
            if (container.cdnEnabled && options.containerCdn) {
                remoteFile.cdnUrl = container.cdnUri + '/' + encodeURIComponent(remoteFile.name);
            }

            callback(null, remoteFile)

        }.bind(this)], function (err, remoteFile) {
            callback(err, remoteFile);
        });
    }
}

/**
 * Exporting view classes
 */
module.exports = PkgClient;