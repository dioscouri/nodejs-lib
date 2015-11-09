
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring application Facade
 */
var applicationFacade = require('../facade.js').ApplicationFacade.instance;

/**
 *  Multi-Tenant handler
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class HttpSession {

    /**
     * Returns Session name
     *
     * @returns {string}
     * @constructor
     */
    static get SESSION_NAME () {
        if (applicationFacade.config.env.SESSION_NAME) {
            return applicationFacade.config.env.SESSION_NAME;
        }

        return 'application.sid';
    }

    /**
     * Is session secure or not
     *
     * @returns {boolean}
     */
    static get isSecure() {
        return false;
    }

    /**
     * Creates Session based on Config Values
     */
    static createSession () {
        var sessionType = null;
        var storageDetails = {};
        if (applicationFacade.config.env.SESSION_STORAGE) {
            storageDetails = require('url').parse(applicationFacade.config.env.SESSION_STORAGE, true);
            if (storageDetails.protocol.toLowerCase() == 'redis:') {
                sessionType = 'redis';
            }
        }

        if (sessionType == 'redis') {
            return HttpSession.createRedisSession(storageDetails);
        } else {
            return HttpSession.createDefaultSession(storageDetails);
        }
    }

    /**
     * Creates Redis Session
     *
     * @returns {*}
     */
    static createRedisSession (storageDetails) {
        var redis   = process.mainModule.require("redis");
        var session = require('express-session');
        var RedisStore = process.mainModule.require('connect-redis')(session);

        var redisClient = redis.createClient(storageDetails.port, storageDetails.hostname);
        redisClient.on('error', function(err) {
            console.log('ERROR. Redis error: ' + err);
        });
        redisClient.on('connect', function(){
            console.log('Connected to Redis: ' + storageDetails.hostname + ":" + storageDetails.port);
        });

        var storeConfig = {
            client: redisClient,
            ttl: (storageDetails.query != null && storageDetails.query.ttl != null ? storageDetails.query.ttl : 14400)
        };
        var sessionStore = new RedisStore(storeConfig);
        var sessionConfig = {
            resave: true,
            saveUninitialized: true,
            store: sessionStore,
            name: HttpSession.SESSION_NAME,
            // maxAge: new Date(Date.now() + 1440000),
            secret: applicationFacade.config.env.SESSION_SECRET
        };

        console.log('#### Initializing Redis session: ', applicationFacade.config.env.SESSION_STORAGE);
        var result = session(sessionConfig);

        return result;
    }

    /**
     * Creates Default Session
     *
     * @returns {*}
     */
    static createDefaultSession (storageDetails) {
        var session = require('express-session');
        var result = session({
            resave: true,
            saveUninitialized: true,
            name: HttpSession.SESSION_NAME,
            secret: applicationFacade.config.env.SESSION_SECRET
        });

        return result;
    }

    /**
     * Set Domain Cookie
     *
     * @param url
     * @param request
     * @param response
     */
    static setDomainCookie (url, request, response) {
        var urlDetails = require('url').parse(url);
        var sessionId = request.sessionID;

        response.cookie(HttpSession.SESSION_NAME, sessionId, {domain: urlDetails.hostname, path: '/', secure: HttpSession.isSecure});
    }
}

/**
 * Exporting URL Utils
 *
 * @type {Function}
 */
exports = module.exports = HttpSession;