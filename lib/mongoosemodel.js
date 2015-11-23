
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring application Facade
 */
var applicationFacade = require('./facade.js').ApplicationFacade.instance;

/**
 * Requiring core Events module
 */
var Model = require('./model.js').Model;

/**
 * Requiring Async library
 *
 * @type {async|exports|module.exports}
 */
var async = require('async');

/**
 * Underscore helper
 *
 * @type {_|exports|module.exports}
 * @private
 */
var _ = require('underscore');

/**
 *  Base Model
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class MongooseModel extends Model {

    /**
     * Model constructor
     */
    constructor (listName) {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

        /**
         * Mongoose Instance
         *
         * @type {*|mongoose|module.exports|*}
         * @private
         */
        this._mongoose = applicationFacade.mongoose;

        // Set base list name
        this._list = listName;

        // Schema definition
        this._schema = null;

        /**
         * Root directory for model
         *
         * @type {String}
         * @private
         */
        this._modelRoot = applicationFacade.basePath + '/app/models/common/';

        /**
         * Model items for API reply
         * @type {Array}
         * @private
         */
        this._responseFields = [];
    }

    /**
     * Get Mongoose instance
     *
     * @returns {*|mongoose|module.exports|*}
     */
    get mongoose () {
        return this._mongoose;
    }

    /**
     * Get Mongoose model for current list
     *
     * @returns {*|mongoose|module.exports|*}
     */
    get model () {
        if (this._model == null) {
            this._model = this.mongoose.model(this._list);
        }

        return this._model;
    }

    /**
     * Get Mongoose model for current list
     *
     * @returns {*|mongoose|module.exports|*}
     */
    get schema () {
        if (this._schema == null && this.model != null) {
            this._schema = this.model.schema;
        }

        return this._schema;
    }

    /**
     * Get model items for API reply
     */
    get responseFields () {
        return this._responseFields;
    }

    /**
     * Loading DBO for model
     */
    initSchema (dboPath) {
        if (dboPath != null) {
            this._schema = require(this._modelRoot + dboPath);
        }

        this._model = this.mongoose.model(this._list, this._schema);
    }

    /**
     * Simple schema registration
     *
     * @param schemaObjectDef
     */
    createSchema (schemaObjectDef) {
        /**
         * Valid mongoose schema
         */
        this._schemaObjectDef = schemaObjectDef;

        /**
         * Creating Schema within mongoose
         *
         * @type {*|{mongo}}
         * @private
         */
        this._schema = this.mongoose.Schema(this._schemaObjectDef);

        return this._schema;
    }

    /**
     * Simple schema registration
     *
     * @param schemaObject Optional parameter
     * @param listName Optional parameter
     */
    registerSchema (schemaObject, listName) {
        if (listName != null) {
            this._list = listName;
        }

        /**
         * Valid mongoose schema
         */
        if (schemaObject != null) {
            this._schema = schemaObject;
        }

        /**
         * Registering Schema within mongoose
         *
         * @type {*|{mongo}}
         * @private
         */
        this._model = this.mongoose.model(this._list, this._schema);

        // Initializing schema from valid object
        this._schema = this._model.schema;
    }

    /**
     * Returns all items for list
     */
    getAll (callback) {
        this.model.find({}, function(err, items){
            if (err != null) {
                callback(err);
            } else {
                callback(null, items);
            }
        });
    }

    /**
     * Prepare pagination details
     *
     * @param pagination
     */
    preparePagination (pagination) {
        pagination.totalPages = Math.ceil(pagination.totalItems / pagination.pageSize);

        if (pagination.currentPage > 3) {
            pagination.firstPage = 1;
        }

        // Page range setup
        var range = 2;
        pagination.lastPage = false;
        if (pagination.currentPage < pagination.totalPages - range) {
            pagination.lastPage = pagination.totalPages;
        }
        var lowRange = pagination.currentPage - range;
        if (pagination.currentPage - range < 1) {
            lowRange = 1;
        }
        var highRange = pagination.currentPage + range;
        if (pagination.currentPage + range > pagination.totalPages) {
            highRange = pagination.totalPages;
        }
        pagination.pageRange = [];
        for (var x = lowRange; x <= highRange; x++) {
            pagination.pageRange.push(x);
        }

        // Pagination summary string
        var current = pagination.currentPage - 1;
        var listCount = parseInt(pagination.pageSize + (pagination.pageSize * current));
        if (listCount > pagination.totalItems) {
            listCount = pagination.totalItems;
        }
        var startItem = pagination.pageSize * current + 1;
        if (startItem < 0) {
            startItem = 0;
        }
        if (startItem != 0 || pagination.totalItems != 0) {
            pagination.counterString = "Showing " + startItem + " to " + listCount + " of " + pagination.totalItems + " entries";
        }
    }

    /**
     * Returns filtered list of items
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
    getListFiltered (filters, populations, pagination, sorting, callback) {
        var self = this;

        var locals = {
            filters: filters,
            pagination: pagination,
            sorting: sorting
        };

        var mongoFilters = {};
        var relationFilter = null;
        var inFieldFilter = null;

        // If only one relation filter set we should create it as array
        if (filters.relation != null && filters.relation.length == null && filters.relation.fieldName != null) {
            var relationFilter = filters.relation;

            filters.relation = [];
            filters.relation.push(relationFilter);
        }

        if (filters.relation && filters.relation.length > 0) {
            relationFilter = {};

            filters.relation.forEach(function (item) {
                if (_.isArray(item.fieldValue)) {
                    relationFilter[item.fieldName] = {$in: item.fieldValue};
                } else {
                    relationFilter[item.fieldName] = item.fieldValue;
                }
            });
        }

        if (filters.inField && filters.inField.length > 0) {
            inFieldFilter = {};

            filters.inField.forEach(function (item) {
                if (_.isArray(item.fieldValue)) {
                    inFieldFilter[item.fieldName] = {$in: item.fieldValue};
                } else {
                    inFieldFilter[item.fieldName] = item.fieldValue;
                }
            });
        }

        var searchFilters = null;
        // Prepare users search input if any
        if (locals.filters.search && locals.filters.search.searchValue && locals.filters.search.searchFields.length) {
            var re = new RegExp(".*"+locals.filters.search.searchValue.trim()+".*", "gi");
            searchFilters = {};

            if (locals.filters.search.searchFields.length > 1) {
                searchFilters.$or = [];
                locals.filters.search.searchFields.forEach(function (item) {
                    var q = {};
                    q[item] = { $regex: re };
                    searchFilters.$or.push(q);
                });
            } else {
                searchFilters[locals.filters.search.searchFields[0]] = { $regex: re };
            }
        }

        mongoFilters.$and = [];

        if (searchFilters) {
            mongoFilters.$and.push(searchFilters);
        }

        if (relationFilter) {
            mongoFilters.$and.push(relationFilter);
        }

        if (inFieldFilter) {
            mongoFilters.$and.push(inFieldFilter);
        }

        if (mongoFilters.$and.length === 1) {
            mongoFilters = mongoFilters.$and[0];
        } else if (mongoFilters.$and.length === 0) {
            mongoFilters = {};
        }

        // Prepare sorting object for mongoose
        var monqoSort = {};
        if (locals.sorting.field && locals.sorting.order) {
            var order = ['asc', 'desc'].indexOf(locals.sorting.order) > -1 ? locals.sorting.order : 'asc';
            monqoSort[locals.sorting.field] = order;
        }

        // Processing final actions
        this._logger.debug('Loading list of items according filters');
        async.series([
            // Get number of elements in the collection according the filters
            function(asyncCallback){
                this.model.count(mongoFilters, function(error, itemsCount){
                    locals.pagination.totalItems = itemsCount;

                    self.preparePagination(locals.pagination);

                    asyncCallback(error);
                });
            }.bind(this),
            //
            function(asyncCallback){
                this
                    .model
                    .find(mongoFilters)
                    .sort(monqoSort)
                    .populate(populations || '')
                    .limit(locals.pagination.pageSize)
                    .skip(locals.pagination.pageSize * (locals.pagination.currentPage - 1))
                    .exec(function (error, items) {
                        locals.items = items;
                        asyncCallback(error);
                    });
            }.bind(this)
        ], function(error){
            callback(error, (error == null ? locals : null));
        });
    }

    /**
     * Returns one item for specified criteria
     */
    findOne (criteria, callback) {
        this.model.findOne(criteria, function(err, items){
            if (err != null) {
                callback(err);
            } else {
                callback(null, items);
            }
        });
    }

    /**
     * Returns one document for specified ID
     */
    findById (id, callback) {
        this.model.findById(id, function(err, item) {
            callback(err, item);
        });
    }

    /**
     * Remove item for specified ID
     * @param {String} id - ID of item.
     * @param {String|Function} [last_modified_by] - Current user
     * @param {Function} [callback] - Callback function.
     */
    removeById (id, last_modified_by, callback) {

        if (typeof callback === 'undefined') {
            callback = last_modified_by;
        }

        this.model.findById(id, function(error, item) {
            if (error != null) {
                return callback(error);
            }

            // Removing item from the collection
            if (item != null) {
                item.last_modified_by = last_modified_by;
                item.remove(function(error){
                    callback(error, item);
                });
            } else {
                callback();
            }
        });
    }

    /**
     * Insert item to the list
     */
    insert (details, callback) {
        var itemObject = new this.model(details);
        itemObject.save(details, function(err){
            if (err != null) {
                if (callback != null) callback(err);
            } else {
                if (callback != null) callback(null, itemObject);
            }
        });
    }

    /**
     * Validate item
     *
     * @param item
     * @param callback
     */
    validate(item, callback){
        callback();
    };

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
 *  Validation Error
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class ValidationError extends Error {

    /**
     * Error constructor
     */
    constructor (message, id) {
        // We must call super() in child class to have access to 'this' in a constructor
        super(message, id)

        // Initializing messages list
        this._messages = [];

        // Add message to list of messages
        this.addMessage(message);
    }

    /**
     * Get list of validation messages
     *
     * @returns {Array}
     */
    get messages () {
        return this._messages;
    }

    /**
     * Add message to the list of messages
     *
     * @param message
     */
    addMessage (message) {
        if (message != null) {
            this._messages.push(message);
        }
    }

    /**
     * Attach error to list of validation errors
     *
     * @param error
     * @param message
     * @param id
     * @returns {ValidationError}
     */
    static attachError (error, message, id) {
        var result = error;

        if (error == null) {
            result = new ValidationError(message, id);
        } else {
            result.addMessage(message);
        }

        return result;
    }

    /**
     * Create validation error based on messages list
     *
     * @param messages
     * @returns {ValidationError}
     */
    static create(messages){
        var result = null;
        if (messages != null && messages.length > 0) {
            for (var i = 0; i < messages.length; i++) {
                result = ValidationError.attachError(result, messages[i])
            }
        }

        return result;
    }
}

/**
 * Exporting Model Classes and Events
 */
module.exports.MongooseModel = MongooseModel;
module.exports.ValidationError = ValidationError;
