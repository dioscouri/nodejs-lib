
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring core Events module
 */
var MongooseModel = require('./mongoosemodel.js').MongooseModel;

/**
 *  Base API Model
 *
 *  @author Sanel Deljkic <dsanel@dioscouri.com>
 */
class BaseAPIModel extends MongooseModel {

    /**
     * Model constructor
     */
    constructor (listName) {
        // We must call super() in child class to have access to 'this' in a constructor
        super(listName);

        /**
         * Model items for API reply
         * @type {Array}
         * @private
         */
        this._responseFields = [];
    }

    /**
     * Get model items for API reply
     */
    get responseFields () {
        return this._responseFields;
    }

    /**
     * Refile Model items for API reply
     * @param item
     * @param callback
     * @abstract
     */
    refineForApi (item, callback) {

        var responseItem = {};

        this._responseFields.forEach((function (responseFiled) {
            responseItem[responseFiled] = item[responseFiled];
        }));

        callback(null, responseItem);
    }
};

/**
 * Exporting Model Classes and Events
 */
module.exports.BaseAPIModel = BaseAPIModel;
