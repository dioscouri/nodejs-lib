
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
 * 
 */
var async = require('async');

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

        /**
         * Module Queue
         *
         * @type {[]}
         * @private
         */
        this._moduleQueue = [];

        /**
         * Flag shows that modules initialized
         *
         * @type {boolean}
         */
        this.isInitialized = false;

        /**
         * Objects registry
         *
         * @type {{}}
         * @private
         */
        var RegistryClass = require('./registry.js');
        this._registry = new RegistryClass();
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
     * Returns Objects Registry
     *
     * @returns {*|Registry|module.exports|*}
     */
    get registry () {
        return this._registry;
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
    init (cb) {
        var $this = this;
        
        async.series([
            function(asCb){
                $this.asyncPreInitModules(asCb);
            },
        ], function(err){

            // Pre-Initializing modules list
            $this.preInitModules();
            
            //Initializing Mongo Database Connection
            $this.initMongoose();
            
            // Initializing modules list
            $this.initModules();
            
            if (cb && typeof cb == "function") {
                return cb();
            }

        });
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
     * PrePre-Initialize Modules
     */
    asyncPreInitModules (cb) {
        var $this = this;
        
        async.each(this._moduleQueue, function(module, asECb){
            var moduleName = module.name;
            var moduleInstance = module.module;
            if (!moduleInstance) {
                return asECb();
            }
            
            if (!moduleInstance.asyncPreInit) {
                return asECb();
            }
            
            // prePreInitializing module
            $this._logger.log("##--##--##--## Trying to asyncPreInit module: ", moduleName);
            moduleInstance.asyncPreInit(function(err){
                return asECb();
            });
            
        }, function(err){
            
            $this._logger.log("##--##--##--## Finished with asyncPreInit");
            
            return cb(err);
        });

    }

    /**
     * Pre-Initialize Modules
     */
    preInitModules () {
        for (var i = 0; i < this._moduleQueue.length; i++) {
            var moduleName = this._moduleQueue[i].name;
            var moduleInstance = this._moduleQueue[i].module;

            this._logger.log("## Trying to pre-initialize module: ", moduleName);
            if (moduleInstance != null) {
                // Initializing module
                if (moduleInstance.preInit != null) {
                    moduleInstance.preInit();
                    this._logger.log("## Pre-Initialized module: ", moduleName);
                } else {
                    this._logger.log("## Pre-Initialize is not defined for module: %s. SKIPPING.", moduleName);
                }
            } else {
                this._logger.warn("## WARNING. Module is not set: ", moduleName);
            }
        }
    }

    /**
     * Initialize Modules
     */
    initModules () {
        for (var i = 0; i < this._moduleQueue.length; i++) {
            var moduleName = this._moduleQueue[i].name;
            var moduleInstance = this._moduleQueue[i].module;

            this._logger.log("## Trying to initialize module: ", moduleName);
            if (moduleInstance != null) {
                // Initializing module
                if (moduleInstance.init != null && !moduleInstance.isAlreadyInitialized) {
                    moduleInstance.init();
                    moduleInstance.isAlreadyInitialized = true;
                    this._logger.log("## Initialized module: ", moduleName);
                } else {
                    this._logger.log("## Initialize is not defined for module: %s. SKIPPING.", moduleName);
                }
            } else {
                this._logger.warn("## WARNING. Module is not set: ", moduleName);
            }
        }

        // Set this.isInitialized flag to true
        this.isInitialized = true;
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
                //this._logger.info('Loading model: %s', modelsPath + '/' + file);
                require(normalizedPath + '/' + file);
            } else {
                this._logger.debug('    @@@@ File %s is not js file. Ignoring.', file);
            }
        }.bind(this));
    }

    /**
     * Loading applications from config file
     *
     * @param configName
     */
    loadApplications (configName) {
        if (configName == null) configName = 'apps.json';

        var configPath = this.basePath + '/config/env/' + configName;
        if (!fs.existsSync(configPath)) {
            this._logger.info('## Applications config is not exists %s. Trying another one.', configPath);
            if (fs.existsSync(this.basePath + '/config/env/' + process.env.APPLICATION_ENV + '-' + configName)) {
                configPath = this.basePath + '/config/env/' + process.env.APPLICATION_ENV + '-' + configName;
            }
        }

        configPath = fs.realpathSync(configPath);
        this._logger.info('## Loading applications config file: ', configPath);

        this._logger.debug('---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------');

        // Loading applications config
        this._appsConfig = require(configPath);
        // this._logger.debug(this._appsConfig);
        if (this._appsConfig != null && this._appsConfig.applications != null && this._appsConfig.applications.length > 0) {
            for (var i = 0; i < this._appsConfig.applications.length; i++) {
                var appInfo = this._appsConfig.applications[i];
                var appName = appInfo.name;
                var ClassDefinition = null;
                try {
                    this._logger.log('#### Requiring application: %s (%s)', appName, appInfo.path);
                    ClassDefinition = require(appInfo.path);
                } catch (error) {
                    var appPath = path.join(this.basePath, appInfo.path)
                    this._logger.warn('#### Failed to load application from default path. Retry from location: ', appPath);
                    ClassDefinition = require(appPath);
                }

                // Loading application as module
                this.load(appName, ClassDefinition)

                if (this.isInitialized) {
                    var appInstance = this[appName];

                    // Initializing Application
                    if (appInstance.init != null && typeof(appInstance.init) == "function") {
                        appInstance.init();
                        appInstance.isAlreadyInitialized = true;
                        this._logger.log("## Initialized application: ", appName);
                    } else {
                        this._logger.log("## Initialize is not defined for application: %s. SKIPPING.", appName);
                    }
                }
            }
        }
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
        this._moduleQueue.push({name: moduleName, module: moduleInstance});
        this[moduleName] = moduleInstance;
    }

    /**
     * Run application facade based on configuration settings
     */
    run () {
        // Set ROOT for static files
        for (var i = 0; i < this._moduleQueue.length; i++) {
            var moduleName = this._moduleQueue[i].name;
            var moduleInstance = this._moduleQueue[i].module;
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
