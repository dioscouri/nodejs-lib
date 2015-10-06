
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

applicationFacade.load('server', DioscouriCore.HTTPServer);
applicationFacade.load('queue', DioscouriCore.QueueClient);

// Bind to ApplicationEvent.MONGO_CONNECTED event
applicationFacade.on(ApplicationEvent.MONGO_CONNECTED, function(event){
    "use strict";
    this._logger.info('#### Initializing Mongo related things for application');
    // this.server.initAcl(require('./app/models/common/acl_permissions'));
}.bind(applicationFacade));

// Initializing all modules
applicationFacade.init();

// Loading models and routes for application
applicationFacade.loadModels('/app/models');
applicationFacade.server.loadRoutes('/app/routes');

/**
 * Loading applications
 */
applicationFacade.loadApplications('apps.json');

/**
 * Running server
 */
applicationFacade.run();
