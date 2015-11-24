
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring core Events module
 */
var MongooseModel = require('./mongoosemodel.js').MongooseModel;

/**
 * Async module
 * @type {async|exports|module.exports}
 */
var async = require('async');

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

    /**
     * Returns one document for specified ID
     */
    findById (id, callback) {
        this.model.findById(id, this.responseFields.join(' '), function(err, item) {
            if (err) {
                return callback(err);
            }
            if (!item) {
                return callback(new Error('Not found'));
            }

            this.refineForApi(
                item,
                function (err, item) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, item);
                }.bind(this)
            );
        }.bind(this));
    }

    /**
     * Returns filtered list of items prepared for API response
     *
     * @param {Object} filters - Filters set
     *
     * @param {Object} [filters.search] - Search filter
     * @param {String} filters.search.searchValue - Search filter value to search
     * @param {Array} filters.search.searchFields - Search fields
     *
     * @param {Array} [filters.relation] - Relations filter
     * @param {String} filters.relation.fieldName - Relations filter item name
     * @param {String|Array} filters.relation.fieldValue - Relations filter item value
     *
     * @param {Array} [filters.inField] - In Field filter
     * @param {String} filters.inField.fieldName - In Field filter item name
     * @param {String|Array} filters.inField.fieldValue - In Field filter item value
     *
     * @param {Object} populations
     * @param {Object} pagination
     * @param {Object} sorting
     * @param {Function} callback
     */
    getListFiltered (filters, populations, pagination, sorting, readyCallback) {
        super.getListFiltered(filters, populations, pagination, sorting, function(error, data){
            if (error != null) {
                return readyCallback(error);
            }

            var responseObject = {
                total_items: data.pagination.totalItems,
                total_pages: data.pagination.totalPages,
                items_per_page: data.pagination.pageSize,
                current_page: data.pagination.currentPage,
                next_page: 0,
                prev_page: false,
                items: []
            };

            if (data.pagination.currentPage === 1) {
                responseObject.prev_page = false;
            } else {
                responseObject.prev_page = data.pagination.currentPage - 1;
            }

            if (data.pagination.currentPage < data.pagination.totalPages) {
                responseObject.next_page = data.pagination.currentPage + 1;
            } else {
                responseObject.next_page = false;
            }

            async.eachLimit(data.items, 10,
                function (item, callback) {
                    this.refineForApi(item, function (err, item) {
                        if (err) {
                            return callback(err);
                        }
                        responseObject.items.push(item);
                        callback();
                    });
                }.bind(this),

                function (err) {
                    readyCallback(err, responseObject);
                }.bind(this)
            );
        }.bind(this));
    }
};

/**
 * Exporting Model Classes and Events
 */
module.exports.BaseAPIModel = BaseAPIModel;
