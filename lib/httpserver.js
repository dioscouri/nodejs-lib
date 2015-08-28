
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring Main HTTP Request/Response Handling logic
 *
 * @type {*|exports|module.exports}
 */
var Express = require('express');

/**
 * Module dependencies.
 */
var passport = require('passport');

/**
 * Requiring core Events module
 */
var events = require('events');

/**
 * File system module
 */
var fs = require('fs');

/**
 * Requiring application Facade
 */
var applicationFacade = require('./facade.js').ApplicationFacade.instance;
var ApplicationEvent = require('./facade.js').ApplicationEvent;

/**
 *  HTTP Server Module.
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class HTTPServer extends events.EventEmitter {

    /**
     * Facade constructor
     */
    constructor () {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

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
         * Express application
         *
         * @type {*|exports|module.exports}
         * @private
         */
        this._application = new Express();

        /**
         * Express server instance
         *
         * @type {*|exports|module.exports|*}
         * @private
         */
        this._server = null;
    }

    /**
     * Returns Express Application instance
     *
     * @returns {*|exports|module.exports|*}
     */
    get application () {
        return this._application;
    }

    /**
     * Returns Express Server instance
     *
     * @returns {*|exports|module.exports|*}
     */
    get server (){
        return this._server;
    }

    /**
     * Returns Application Configuration
     *
     * @returns {*|Configuration|module.exports|*}
     */
    get config (){
        return this._config;
    }

    /**
     * Returns An Access Control List module instance
     *
     * @returns {*|acl|module.exports|*}
     */
    get acl () {
        return this._acl;
    }

    /**
     * Run application facade based on configuration settings
     */
    init () {
        // Set body parsers for Express
        var bodyParser = require('body-parser');
        this.application.use(bodyParser.json());
        this.application.use(bodyParser.urlencoded({extended: true})); // We are using extended parsing to get array/object values in a proper way

        // Cookie Parsing Middleware
        var cookieParser = require('cookie-parser');
        this.application.use(cookieParser());

        // Enable sessions
        var session = require('express-session');
        this.application.use(session({
            resave: true,
            saveUninitialized: true,
            secret: this.config.env.SESSION_SECRET
        }));

        // Passport authentication middleware
        this.application.use(passport.initialize());
        this.application.use(passport.session());

        // Set ROOT for static files
        this.application.use(Express.static('public'));
    }

    /**
     * Initialize passport from the handlers
     * Apply passwordModel with the method registerPassportHandlers()
     *
     * @param passportModel
     */
    initPassport (passportModel) {
        this._logger.info('## Registering passport model and handlers.');
        passportModel.registerPassportHandlers(passport);
    }

    /**
     * Loading routes for some path
     *
     * @param routesPath
     */
    loadRoutesFromFile (routesPath) {

        var routesPath = routesPath;
        if (!fs.existsSync(routesPath)) {
            // this._logger.info('## Routes file is not exists %s. Trying another one.');
            if (fs.existsSync(applicationFacade.basePath + '/' + routesPath)) {
                routesPath = applicationFacade.basePath + '/' + routesPath;
            }
        }

        var routesList = require(routesPath).apply();

        this._logger.info('Loading routes: ' + routesPath);

        /**
         * Loading routes
         */
        for (var routePath in routesList) {
            var controllerPath = applicationFacade.basePath + '/app/controllers/' + routesList[routePath];

            var routeDetails = routePath.split('|', 2);

            if (routeDetails.length != 2) {
                this._logger.warn('Invalid route: ' + routePath);
            } else {
                this._logger.info('        Initializing route: ' + routePath);
                var httpMethodsString = routeDetails[0].toLowerCase();
                var routeUrl = routeDetails[1];
                var httpMethods = httpMethodsString.split(',');
                for (var i = 0; i < httpMethods.length; i++) {
                    if (httpMethods.length > 1) {
                        this._logger.info('            - Adding: %s|%s', httpMethods[i], routeUrl);
                    }
                    var methodName = httpMethods[i];
                    var controllerHandler = require(controllerPath);

                    this.application[methodName](routeUrl, controllerHandler);
                }
            }
        }
    }

    /**
     * Loading routes for some path
     *
     * @param routesPath
     */
    loadRoutes (routesPath) {
        // var normalizedPath = require("path").join(__dirname, '..', routesPath);
        var normalizedPath = routesPath;
        if (!fs.existsSync(normalizedPath)) {
            this._logger.info('## Routes file is not exists %s. Trying another one.', normalizedPath);
            if (fs.existsSync(applicationFacade.basePath + '/' + normalizedPath)) {
                normalizedPath = applicationFacade.basePath + '/' + normalizedPath;
            }
        }

        this._logger.info('---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------');

        // Loading models
        require("fs").readdirSync(normalizedPath).forEach(function(file) {
            if (file.indexOf('.js') != -1) {
                this.loadRoutesFromFile(normalizedPath + '/' + file);
            } else {
                this._logger.debug('    @@@@ File %s is not js file. Ignoring.', file);
            }

        }.bind(this));
    }

    /**
     * Initialize An Access Control List
     */
    initAcl(permissionsModel) {
        permissionsModel.initAcl(function (err, acl) {
            if (err) {
                return this._logger.error('#### Failed to initialise ACL system');
            }
            this._acl = acl;
        }.bind(this));
    }

    /**
     * Run HTTP Server based on configuration settings
     */
    run () {
        var $this = this;
        this._server = this.application.listen(this.config.env.SERVER_PORT, this.config.env.SERVER_HOST, () => {
            // TODO Arrow functions are still not working properly. We'll use usual closures
            $this.emit(ApplicationEvent.SERVER_STARTED);
            var host = $this.server.address().address;
            var port = $this.server.address().port;

            $this._logger.log('---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------');
            $this._logger.log('Server is UP and Running. Listening at http://%s:%s', host, port);
            $this._logger.log('\n');
        });
    };
}

/**
 * Exporting HTTP Server
 */
module.exports = HTTPServer;
