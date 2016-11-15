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
 * OS node core module
 */
var os = require('os');

/**
 * Path node core module
 */
var path = require('path');

/**
 *  Class that implements pkg cloud API
 */
class PkgClient {

    /**
     * Constructor
     *
     */
    constructor(clientConfig) {

        /**
         * Global config
         *
         * @private
         */
        this._config = require('./facade.js').ApplicationFacade.instance.config;

        /**
         * Trying to set default client configs
         */
        this.clientConfig = clientConfig;
        if (!this.clientConfig && this._config._configuration != null && this._config._configuration.pkgcloud != null) {
            this.clientConfig = this._config._configuration.pkgcloud;
        }
    }

    /**
     * Return a client
     *
     */
    get client() {
        if (this._client == null) {

            if (this.clientConfig.provider === 'rackspace') {

                /**
                 * Pkg Cloud client for rackspace.com
                 *
                 * @private
                 */
                this._client = require('pkgcloud').storage.createClient({
                    provider: this.clientConfig.provider,
                    username: this.clientConfig.userName,
                    apiKey: this.clientConfig.apiKey,
                    region: this.clientConfig.region
                });

            } else if (this.clientConfig.provider === 'azure') {

                /**
                 * Pkg Cloud client
                 *
                 * @private
                 */
                this._client = require('pkgcloud').storage.createClient({
                    provider: this.clientConfig.provider,
                    storageAccount: this.clientConfig.azureAccount,
                    storageAccessKey: this.clientConfig.azureAccessKey
                });

            } else {

                throw new Error(`PkgClient::client: provider "${this.clientConfig.provider}" is not supported.`);
            }
        }

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

            if (this.clientConfig.provider !== 'rackspace') return callback(null, container);

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
            var remoteFileName = options.fileName ? rs.generate(5) + '_' + options.fileName : rs.generate(20);

            if (this.clientConfig.provider === 'azure') {

                // azure BLOB storage is not support some charsets in names
                remoteFileName = remoteFileName.replace(/[^a-z0-9A-Z\._]+/g, '-');
            }

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
            if (options.containerCdn) {

                if (this.clientConfig.provider === 'rackspace') {

                    remoteFile.cdnUrl = container.cdnUri + '/' + encodeURIComponent(remoteFile.name);

                    callback(null, remoteFile);

                } else if (this.clientConfig.provider === 'azure') {

                    remoteFile.cdnUrl =
                        `https://${this.clientConfig.azureAccount}.blob.core.windows.net/${remoteFile.container}/${encodeURIComponent(remoteFile.name)}`;

                    callback(null, remoteFile);

                } else {

                    callback(new Error(`PkgClient::upload: unexpected provider "${this.clientConfig.provider}"`));
                }
            }

        }.bind(this)], function (err, remoteFile) {
            callback(err, remoteFile);
        });
    }

    /**
     * Download item from the specified container
     *
     * @param {Object} options - Download options
     * @param {string} options.fileName - Remote file name
     * @param {string} options.containerName - Container name
     * @param {string} [options.saveToFile] - Container name
     * @param {function} callback - Callback function
     */
    download(options, callback) {

        if (!options.saveToFile) {
            options.saveToFile = path.join(os.tmpdir(), rs.generate(5) + '_' + options.fileName);
        }

        var stream = this.client.download({
            container: options.containerName,
            remote: options.fileName
        }, (err) => {
            if (err) return callback(err);

            callback(null, {localFile: options.saveToFile});
        });

        stream.pipe(fs.createWriteStream(options.saveToFile));
    }
}

module.exports = PkgClient;
