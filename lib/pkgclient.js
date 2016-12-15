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
 * Microsoft Azure Storage SDK
 */
const azure = require('azure-storage');

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
                 * azureStorageType can be: fileStorage, blobStorage (default)
                 */
                if (this.clientConfig.azureStorageType === 'fileStorage') {

                    this._client = azure.createFileService(this.clientConfig.azureAccount, this.clientConfig.azureAccessKey);

                } else {

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
                }

            } else {

                throw new Error(`PkgClient::client: provider "${this.clientConfig.provider}" is not supported.`);
            }
        }

        return this._client;
    }

    /**
     * Obtain remove file name
     *
     * @param options
     * @param {string} options.fileName - File name.
     */
    getRemoteFileName(options) {

        /**
         * Remote file name, MUST be unique
         * @type {string}
         */
        let remoteFileName = options.fileName ? rs.generate(5) + '_' + options.fileName : rs.generate(20);

        if (this.clientConfig.provider === 'azure') {

            // azure BLOB storage is not support some charsets in names
            remoteFileName = remoteFileName.replace(/[^a-z0-9A-Z\._]+/g, '-');
        }

        return remoteFileName;
    }

    /**
     * Upload file to Blob / File storage
     *
     * @param {string} file - Local file path
     * @param {Object} options - Upload options.
     * @param {string} options.fileName - File name.
     * @param {string} [options.containerName] - Container name.
     * @param {string} [options.shareName] - Share name.
     * @param {boolean} [options.containerCdn] - Should container use CDN or not.
     * @param {function} callback - Callback function.
     */
    upload(file, options, callback) {

        if (this.clientConfig.provider === 'azure' && this.clientConfig.azureStorageType === 'fileStorage') {

            this.azureFileUpload(file, options, callback);

        } else {

            this.blobUpload(file, options, callback);
        }
    }

    /**
     * Upload item to the specified container, create container if it's not exist
     *
     * @param {string} file - Local file path
     * @param {Object} options - Upload options.
     * @param {string} options.fileName - File name.
     * @param {string} options.containerName - Container name.
     * @param {string} options.shareName - Share name.
     * @param {boolean} options.containerCdn - Should container use CDN or not.
     * @param {function} callback - Callback function.
     */
    blobUpload(file, options, callback) {

        async.waterfall([callback => {

            this.client.getContainer(options.containerName, (err, container) => {

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

        }, (container, callback) => {

            if (container) {
                callback(null, container);
            } else {
                this.client.createContainer({
                    name: options.containerName
                }, callback);
            }

        }, (container, callback) => {

            if (this.clientConfig.provider !== 'rackspace') return callback(null, container);

            if (!container.cdnEnabled && options.containerCdn) {
                container.enableCdn(err => {
                    callback(err, container);
                });
            } else {
                callback(null, container);
            }

        }, (container, callback) => {

            /**
             * Create a read stream for our source file
             */
            let source = fs.createReadStream(file);

            /**
             * Remote file name, MUST be unique
             * @type {string}
             */
            let remoteFileName = this.getRemoteFileName(options);

            /**
             * Create a writable stream for our destination
             */
            let dest = this.client.upload({
                container: options.containerName,
                remote: remoteFileName
            });

            dest.on('error', callback);

            dest.on('success', remoteFile => {
                callback(null, container, remoteFile);
            });

            /**
             * Pipe the source to the destination
             */
            source.pipe(dest);

        }, (container, remoteFile, callback) => {

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

        }], (err, remoteFile) => {
            callback(err, remoteFile);
        });
    }

    /**
     * Upload file to Azure share
     *
     * @param {string} file - Local file path
     * @param {Object} options - Upload options.
     * @param {string} options.fileName - File name.
     * @param {string} options.shareName - Share name.
     * @param {function} callback - Callback function.
     */
    azureFileUpload(file, options, callback) {

        this.client.createFileFromLocalFile(options.shareName, '', this.getRemoteFileName(options), file, (err, result, response) => {
            if (err) {
                console.log(err.stack);
                return callback(err);
            }

            // console.log(result);
            // console.log(response);

            if (!response.isSuccessful) {

                return callback(new Error(`Upload to Azure Share was failed. statusCode is ${response.statusCode}`));
            }

            /**
             FileResult {
              share: 'gvs-app-doctor-documents',
              directory: '',
              name: 'kI0Qw_error.jpg',
              etag: '"0x8D424F38133157D"',
              lastModified: 'Thu, 15 Dec 2016 14:06:02 GMT',
              requestId: '0647ce05-001a-00bc-33dc-56df3e000000' }
             { isSuccessful: true,
               statusCode: 200,
               body: '',
               headers:
                { 'transfer-encoding': 'chunked',
                  'last-modified': 'Thu, 15 Dec 2016 14:06:02 GMT',
                  etag: '"0x8D424F38133157D"',
                  server: 'Windows-Azure-File/1.0 Microsoft-HTTPAPI/2.0',
                  'x-ms-request-id': '0647ce05-001a-00bc-33dc-56df3e000000',
                  'x-ms-version': '2015-12-11',
                  date: 'Thu, 15 Dec 2016 14:06:02 GMT',
                  connection: 'close' },
               md5: undefined
             }
             */

            callback(null, {
                fileName: result.name,
                name: result.name
            });
        });
    }

    /**
     * Download item from the specified container
     *
     * @param {Object} options - Download options
     * @param {string} options.fileName - Remote file name
     * @param {string} [options.containerName] - Container name
     * @param {string} [options.shareName] - Azure share name
     * @param {string} [options.saveToFile] - File make to store
     * @param {function} callback - Callback function
     */
    download(options, callback) {

        if (!options.saveToFile) {
            options.saveToFile = path.join(os.tmpdir(), rs.generate(5) + '_' + options.fileName);
        }

        if (this.clientConfig.provider === 'azure' && this.clientConfig.azureStorageType === 'fileStorage') {

            this.azureFileDownload(options, callback);

        } else {

            this.blobDownload(options, callback);
        }
    }

    /**
     * Download file from BLOB storage
     *
     * @param options
     * @param {string} options.fileName - Remote file name
     * @param {string} [options.containerName] - Container name
     * @param callback
     */
    blobDownload(options, callback) {

        let stream = this.client.download({
            container: options.containerName,
            remote: options.fileName
        }, (err) => {
            if (err) return callback(err);

            callback(null, {localFile: options.saveToFile});
        });

        stream.pipe(fs.createWriteStream(options.saveToFile));
    }

    /**
     * Download file from Azure share
     *
     * @param options
     * @param {string} options.fileName - Remote file name
     * @param {string} options.shareName - Azure share name
     * @param callback
     */
    azureFileDownload(options, callback) {

        this.client.getFileToStream(options.shareName, '',  options.fileName, fs.createWriteStream(options.saveToFile), (err, result, response) => {
            if (err) {
                console.log(err.stack);
                return callback(err);
            }

            // TODO
            console.log(result);
            console.log(response);

            callback(null, {localFile: options.saveToFile});
        });
    }
}

module.exports = PkgClient;
