// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring application Facade
 */
var applicationFacade = require('./facade.js').ApplicationFacade.instance;
var ApplicationEvent = require('./facade.js').ApplicationEvent;

var monq = require('monq');

/**
 *  Job Queue based on MongoDB
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class QueueClient {

    /**
     * Queue client constructor
     */
    constructor () {

        var self = this;

        /**
         * Application config
         *
         * @type {Configuration|exports|module.exports}
         * @private
         */
        this._config = applicationFacade.config;

        /**
         * Requiring system logger
         *
         * @type {Logger|exports|module.exports}
         * @private
         */
        this._logger = require('./logger.js');

        /**
         * MongoDB collection name for workers
         * @type {*|string}
         * @private
         */
        this._workersCollection = this._config.env.WORKERS_COLLECTION || 'queue_tasks';

        /**
         * Monq Client instance
         * @type {Connection|*}
         * @private
         */
        this._client = monq(this._config.env.MONGODB_URL, { collection : this._workersCollection });

        /**
         * Flag for finished monq init
         *
         * @type {boolean}
         * @private
         */
        this._clientInitialized = false;

        /**
         * Init connection for monq enqueue
         */
        this._client.init(function() {
            this._clientInitialized = true;
        }.bind(this));
    }

    /**
     * Enqueue Job
     *
     * @param job
     * @param callback Callback function when job is enqued
     * @returns {number|Object}
     */
    enqueue (job, callback) {
        var self = this;

        if (!this._clientInitialized) {
            return setTimeout(function() {
                self.enqueue(job, callback);
            }, 10);
        }

        if (!job) {
            if (callback != null) {
                return callback(new Error('Job can\'t be undefined'));
            } else {
                throw new Error('Job can\'t be undefined');
            }
        }

        var workerName = job.workerName,      // Name of file: test.js -> test
            commandName = job.commandName,
            params = job.params,
            options = {
                delay: job.delay,
                priority: job.priority,
                attempts: {count: 3, delay: 1000 * 60} // 3 attempts with 1 min delay
            };

        // Not sure we need it in the client
        // this.checkWorkerCommand(workerName, commandName);

        var queue = this._client.queue(workerName, { collection: self._workersCollection});
        queue.enqueue(commandName, params, options, function (err, job) {
            if (err) {
                this._logger.error(err);
                if (callback != null) {
                    return callback(err);
                }
            } else {
                if (callback != null) {
                    return callback(null, job);
                }

                this._logger.debug('---- SCHEDULED JOB: %s.%s()', job.data.queue, job.data.name);
            }
        }.bind(this));
    }

    /**
     * Archive job
     *
     * @param job
     */
    archive (job) {
        this._client.archive(job);
    }

    /**
     * Run queue
     */
    run () {
    }
}

module.exports = QueueClient;
