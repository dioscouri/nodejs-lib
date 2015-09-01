// Using STRICT mode for ES6 features
"use strict";

var DioscouriCore = require('dioscouri-core');

/**
 * Requiring Application events
 *
 * @type {*|{SERVER_STARTED: string, MONGO_CONNECTED: string}|ApplicationEvent}
 */
var ApplicationEvent = DioscouriCore.ApplicationEvent;

/**
 *  Importing Application Facade and run the Application.
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
var applicationFacade = DioscouriCore.ApplicationFacade.instance;

applicationFacade.load('queue', DioscouriCore.QueueServer);

// Bind to ApplicationEvent.MONGO_CONNECTED event
applicationFacade.on(ApplicationEvent.MONGO_CONNECTED, function(event){
    "use strict";
    this._logger.info('#### Mongo connection Initialized');
}.bind(applicationFacade));

// Initializing all modules
applicationFacade.init();

// Loading models for application
// applicationFacade.loadModels('app/models');

/**
 * Set events for worker jobs
 */
applicationFacade.queue.setWorkersDir('./app/workers');
applicationFacade.queue.setWorkerEvents({
    // COMPLETE handler
    complete: function (job) {
        var jobResult = job.result;
        try {
            jobResult = JSON.stringify(job.result);
        } catch (error) {
            // SKIPPING;
        }
        this._logger.log('Job completed: %s - %s (%s) = %s', job.queue, job.name, job._id, jobResult);
        this.archive(job);
    }.bind(applicationFacade.queue),

    // DEQUEUED handler
    dequeued: function (job) {
        this._logger.debug('**** Dequeued job: %s, %s: %s', job._id, job.queue, job.name);
    }.bind(applicationFacade.queue),

    // FAILED handler
    failed: function (job) {
        this._logger.log('!!!! Failed to run job: %s, %s: %s', job._id, job.queue, job.name);

        // Archive job after all attempts (default set to 3)
        if (job.attempts.remaining === 0) {
            this.archive(job);
        }
    }.bind(applicationFacade.queue),

    // ERROR handler
    error: function (error) {
        this._logger.error(error);
    }.bind(applicationFacade.queue)
});

/**
 * Running application
 */
applicationFacade.run();
