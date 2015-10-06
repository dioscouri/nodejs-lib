
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
     */
    getListFiltered (filters, populations, pagination, sorting, callback) {
        var self = this;

        var locals = {
            filters: filters,
            pagination: pagination,
            sorting: sorting
        };

        // TODO set proper mongo filters
        var mongoFilters = {};

        // Prepare users search input if any
        if (locals.filters.search && locals.filters.search.searchValue && locals.filters.search.searchFields.length) {
            var re = new RegExp(".*"+locals.filters.search.searchValue.trim()+".*", "gi");

            if (locals.filters.search.searchFields.length > 1) {
                mongoFilters.$or = [];
                locals.filters.search.searchFields.forEach(function (item) {
                    var q = {};
                    q[item] = { $regex: re };
                    mongoFilters.$or.push(q);
                });
            } else {
                mongoFilters[locals.filters.search.searchFields[0]] = { $regex: re };
            }
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
                callback(err);
            } else {
                callback(null, itemObject);
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