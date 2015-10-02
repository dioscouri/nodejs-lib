
// Using STRICT mode for ES6 features
"use strict";

/**
 * Initializing application facade before export
 */
module.exports = {
    ApplicationEvent: require('./lib/facade.js').ApplicationEvent,
    ApplicationFacade: require('./lib/facade.js').ApplicationFacade,
    ControllerEvent: require('./lib/controller.js').ControllerEvent,
    Controller: require('./lib/controller.js').Controller,
    ExecutionState: require('./lib/controller.js').ExecutionState,
    FlashMessageType: require('./lib/flashmessages.js').FlashMessageType,
    HTTPServer: require('./lib/httpserver.js'),
    Logger: require('./lib/logger.js'),
    Mailer: require('./lib/mailer.js'),
    Model: require('./lib/model.js').Model,
    ModuleBootstrap: require('./lib/modulebootstrap.js'),
    ModuleView: require('./lib/view/moduleview.js').ModuleView,
    MongooseModel: require('./lib/mongoosemodel.js').MongooseModel,
    ValidationError: require('./lib/mongoosemodel.js').ValidationError,
    PkgClient: require('./lib/pkgclient.js'),
    QueueClient: require('./lib/queueclient.js'),
    QueueServer: require('./lib/queueserver.js'),
    ViewType: require('./lib/view.js').ViewType,
    View: require('./lib/view.js').View
};
