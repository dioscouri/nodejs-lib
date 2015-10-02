
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

/**
 * Requiring core Events module
 */
var events = require('events');

/**
 * Path module
 */
var path = require('path');

/**
 * File systems module
 */
var fs = require('fs');

/**
 * Requiring Application configuration
 *
 * @type {exports|module.exports}
 */
var ApplicationConfig = require('./config.js').Configuration;

/**
 * Application Events
 *
 * @type {{SERVER_STARTED: string, MONGO_CONNECTED: string}}
 */
var ApplicationEvent = {
    SERVER_STARTED: 'SERVER_STARTED',
    MONGO_CONNECTED: 'MONGO_CONNECTED'
};

/**
 *  Application Facade. Initialize Application and Handles common Application data.
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class ApplicationFacade extends events.EventEmitter {

    /**
     * Facade constructor
     */
    constructor () {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

        /**
         * Requiring system logger
         *
         * @type {Logger|exports|module.exports}
         * @private
         */
        this._logger = require('./logger.js');

        /**
         * Checking that current instance is not initialized yet
         */
        if (ApplicationFacade._instance != null) {
            throw new Error('Could not reinitialize ApplicationFacade.');
        }

        // Set base path of application
        this._basePath = path.dirname(process.mainModule.filename);
        this._logger.log('## Set base PATH of the application: ', this._basePath);

        /**
         * Application config
         *
         * @type {Configuration|exports|module.exports}
         * @private
         */
        this._config = new ApplicationConfig(this._basePath);

        /**
         * Mongoose connection
         *
         * @type {*|exports|module.exports|*}
         * @private
         */
        this._mongoseConnection = null;

        /**
         * Mongoose instance
         *
         * @type {*|exports|module.exports|*}
         * @private
         */
        this._mongoose = require('mongoose');

        /**
         * Modules Map
         *
         * @type {{}}
         * @private
         */
        this._modules = {};
    }

    /**
     * Static singleton instance of ApplicationFacade
     *
     * @return ApplicationFacade
     */
    static get instance () {
        if (ApplicationFacade._instance == null) {
            ApplicationFacade._instance = new ApplicationFacade();
        }

        return ApplicationFacade._instance;
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
     * Returns HTTP Server instance
     *
     * @returns {HTTPServer}
     */
    get server (){
        return this._server;
    }

    /**
     * Set HTTP Server instance
     *
     * @param {HTTPServer} value
     */
    set server (value){
        this._server = value;
    }

    /**
     * Returns base path of the application
     *
     * @returns String
     */
    get basePath (){
        return this._basePath;
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
     * Returns Mongoose Instance
     *
     * @returns {*|mongoose|module.exports|*}
     */
    get mongoose (){
        return this._mongoose;
    }

    /**
     * Return Queue instance
     *
     * @returns {Queue}
     */
    get queue () {
        return this._queue;
    }

    /**
     * Set Queue instance
     *
     * @param {Queue} value
     */
    set queue (value) {
        this._queue = value;
    }

    /**
     * Run application facade based on configuration settings
     */
    init () {
        /**
         * Initializing Mongo Database Connection
         */
        this.initMongoose();

        // Initializing modules list
        this.initModules();
    }

    /**
     * Initialize Mongoose connection
     */
    initMongoose () {
        // Initializing mongoose
        this._mongoose.connect(this.config.env.MONGODB_URL);

        this._logger.log(this.config.env.MONGODB_URL);
        // Handling connect event
        this._mongoose.connection.on('connected', function(){
            this._logger.info('#### Successfully connected to MongoDB server');
            this.emit(ApplicationEvent.MONGO_CONNECTED);
        }.bind(this));

        // Handling error event
        this._mongoose.connection.on('error', function(){
            this._logger.error('#### Failed to connect to MongoDB server');
        }.bind(this));

        // Handling disconnect event
        this._mongoose.connection.on('disconnected', function(){
            this._logger.warn('#### Warning application disconnected from the MongoDB server');
        }.bind(this));

        // If the Node process ends, close the Mongoose connection
        process.on('SIGINT', function() {
            this.mongoose.connection.close(function () {
                console.error('#### Mongoose default connection disconnected through app termination');
                process.exit(0);
            });
        }.bind(this));
    }

    /**
     * Initialize Modules
     */
    initModules () {
        for (var moduleName in this._modules) {
            var moduleInstance = this[moduleName];
            this._logger.log("## Trying to initialize module: ", moduleName);
            if (moduleInstance != null) {
                // Initializing module
                if (moduleInstance.init != null) {
                    moduleInstance.init();
                    this._logger.log("## Initialized module: ", moduleName);
                } else {
                    this._logger.log("## Initialize is not defined for module: %s. SKIPPING.", moduleName);
                }
            } else {
                this._logger.warn("## WARNING. Module is not set: ", moduleName);
            }
        }
    }

    /**
     * Loading models for some path
     *
     * @param modelsPath
     */
    loadModels (modelsPath) {
        //var normalizedPath = require("path").join(__dirname, '..', modelsPath);
        var normalizedPath = modelsPath;
        if (!fs.existsSync(normalizedPath)) {
            this._logger.info('## Models Dir is not exists %s. Trying another one.', normalizedPath);
            if (fs.existsSync(this.basePath + '/' + normalizedPath)) {
                normalizedPath = this.basePath + '/' + normalizedPath;
            }
        }

        normalizedPath = fs.realpathSync(normalizedPath);
        this._logger.info('## Get realpath of models directory: ', normalizedPath);

        this._logger.debug('---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------');

        // Loading models
        require("fs").readdirSync(normalizedPath).forEach(function(file) {
            if (file.indexOf('.js') != -1) {
                this._logger.info('Loading model: %s', modelsPath + '/' + file);
                require(normalizedPath + '/' + file);
            } else {
                this._logger.debug('    @@@@ File %s is not js file. Ignoring.', file);
            }
        }.bind(this));
    }

    /**
     * Load module and register it
     *
     * @param moduleName
     * @param path
     */
    load(moduleName, path, className){

        var ModuleClass;
        if (path instanceof Function) {
            this._logger.debug('## Detecting module type for %s. Class-Function detected.', moduleName);
            ModuleClass = path;
        } else {
            this._logger.debug('## Detecting module type for %s. Local path detected \'%s\'', moduleName, path);
            ModuleClass = require(path);
        }

        // Initializing module
        var moduleInstance = new ModuleClass();

        // Set modules Map
        this._modules[moduleName] = moduleInstance;
        this[moduleName] = moduleInstance;
    }

    /**
     * Run application facade based on configuration settings
     */
    run () {
        for (var moduleName in this._modules) {
            var moduleInstance = this[moduleName];
            this._logger.log("## Starting module: ", moduleName);
            if (moduleInstance != null) {
                // Running module
                if (moduleInstance.run != null) {
                    this._logger.log("## Running module: ", moduleName);
                    moduleInstance.run();
                } else {
                    this._logger.log("## Run is not defined for module: %s. SKIPPING.", moduleName);
                }
            } else {
                this._logger.warn("## WARNING. Module is not set: ", moduleName);
            }
        }
    };
}

/**
 * Initializing application facade before export
 */
module.exports.ApplicationEvent = ApplicationEvent;
module.exports.ApplicationFacade = ApplicationFacade;
