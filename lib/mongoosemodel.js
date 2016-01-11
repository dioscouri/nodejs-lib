
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
 * Stream library: https://github.com/dominictarr/event-stream
 *
 * @type {exports|module.exports}
 */
var eventStream = require('event-stream');

/**
 * Objects helper
 *
 * @type {*|exports|module.exports}
 */
var objectPath = require('object-path');

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
         * Rules for mandatory fields validation
         *
         * @type {Array}
         * @private
         */
        this._validationMandatoryFields = [];

        /**
         * Custom validation rules
         *
         * @type {Array}
         * @private
         */
        this._customValidators = [];
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
     * Get Mongoose list (model) name
     *
     * @returns {String}
     */
    get listName () {
        return this._list;
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

    get validationMandatoryFields () {
        return this._validationMandatoryFields;
    }

    get customValidators () {
        return this._customValidators;
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

        var locals = {
            filters: filters,
            pagination: pagination,
            sorting: sorting
        };

        // Mongoose filter object
        var mongoFilters = this.prepareMongoFilters(locals);

        // Mongoose sorting object
        var mongoSort = this.prepareMongoSort(locals);

        // Processing final actions
        this._logger.debug('Loading list of items according filters');

        async.series([
            // Get number of elements in the collection according the filters
            (asyncCallback) => {
                this.countListFiltered(mongoFilters, (error, itemsCount) => {
                    locals.pagination.totalItems = itemsCount;

                    this.preparePagination(locals.pagination);

                    asyncCallback(error);
                });
            },

            // Get items from the collection according the filters
            (asyncCallback) => {
                this.fetchListFiltered(locals, populations, mongoFilters, mongoSort, function (error, items) {
                    locals.items = items;
                    asyncCallback(error);
                });
            }
        ], (error) => {
            callback(error, (error == null ? locals : null));
        });
    }

    /**
     * Returns filtered items list count
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
     * @param {Function} callback
     */
    getListCountFiltered (filters, callback) {

        var locals = {
            filters: filters
        };

        // Mongoose filter object
        var mongoFilters = this.prepareMongoFilters(locals);

        this.countListFiltered(mongoFilters, callback);
    }

    /**
     * Prepare Filters for MongoDB
     *
     * @param locals
     */
    prepareMongoFilters (locals) {

        var mongoFilters = {};
        var relationFilter = null;
        var inFieldFilter = null;

        // If only one relation filter set we should create it as array
        if (locals.filters.relation != null && locals.filters.relation.length == null && locals.filters.relation.fieldName != null) {
            relationFilter = locals.filters.relation;

            locals.filters.relation = [];
            locals.filters.relation.push(relationFilter);
        }

        if (locals.filters.relation && locals.filters.relation.length > 0) {
            relationFilter = {};

            locals.filters.relation.forEach(function (item) {
                if (_.isArray(item.fieldValue)) {
                    relationFilter[item.fieldName] = {$in: item.fieldValue};
                } else {
                    relationFilter[item.fieldName] = item.fieldValue;
                }
            });
        }

        if (locals.filters.inField && locals.filters.inField.length > 0) {
            inFieldFilter = {};

            locals.filters.inField.forEach(function (item) {
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

        // Add possibility to add custom filter to mongoose
        var customFilter = null;
        if (locals.filters.customFilter) {
            customFilter = locals.filters.customFilter;
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

        if (customFilter) {
            mongoFilters.$and.push(customFilter);
        }

        if (mongoFilters.$and.length === 1) {
            mongoFilters = mongoFilters.$and[0];
        } else if (mongoFilters.$and.length === 0) {
            mongoFilters = {};
        }

        return mongoFilters;
    }

    /**
     * Prepare Sorting object for MongoDB
     *
     * @param locals
     */
    prepareMongoSort (locals) {

        var mongoSort = {};

        if (locals.sorting.field && locals.sorting.order) {
            var order = ['asc', 'desc'].indexOf(locals.sorting.order) > -1 ? locals.sorting.order : 'asc';
            mongoSort[locals.sorting.field] = order;
        }

        return mongoSort;
    }

    /**
     * Count list items according a filter
     *
     * @param mongoFilters
     * @param callback
     */
    countListFiltered (mongoFilters, callback) {

        this.model.count(mongoFilters, function(error, itemsCount){
            callback(error, itemsCount);
        });
    }

    /**
     * Fetch list items according a filter
     *
     * @param locals
     * @param populations
     * @param mongoSort
     * @param mongoFilters
     * @param callback
     */
    fetchListFiltered (locals, populations, mongoFilters, mongoSort, callback) {

        this
            .model
            .find(mongoFilters)
            .sort(mongoSort)
            .populate(populations || '')
            .limit(locals.pagination.pageSize)
            .skip(locals.pagination.pageSize * (locals.pagination.currentPage - 1))
            .exec(callback);
    }

    /**
     * Returns one item for specified criteria
     */
    findOne (criteria, callback) {
        this.model.findOne(criteria, function(err, item){
            if (err != null) {
                callback(err);
            } else {
                callback(null, item);
            }
        });
    }

    /**
     * Returns items for specified criteria
     */
    findAll(criteria, callback) {
        this.model.find(criteria, function (err, items) {
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
     * Returns one document for specified ID
     */
    findByIdAndPopulate (id, populations, callback) {
        this.model.findOne({_id: id}).populate(populations || '').exec((err, item) => {
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
    validate(item, callback) {
        callback();
    };

    /**
     * Validate all model instances
     *
     * @param callback
     */
    validateAll(callback) {

        async.series([callback => {

            // Remove all notifications for this resource
            this.clearNotifications(callback);

        }, callback => {

            // Do validate all resource instances
            this.doValidate(callback);

        }], callback);
    }

    /**
     * Validate all resource instances
     *
     * @param callback
     */
    doValidate(callback) {

        var completed = false;
        var stream    = this.model.find().stream();
        var $this     = this;

        stream.pipe(eventStream.through(function (item) {

            var _flow = this;

            _flow.pause();

            async.eachSeries($this.validationMandatoryFields, (mandatoryField, callback) => {

                if (objectPath.get(item, mandatoryField.patch)) {
                    callback();
                } else if (typeof mandatoryField.fix === 'function') {
                    // Try to fix
                    mandatoryField.fix(item, function (error, fixed) {
                        if (error || !fixed) {
                            // Fix fails
                            if (error) {
                                console.log(error);
                            }
                            if (mandatoryField.notification) {
                                $this.notifyAboutInvalidResource(item, mandatoryField.notification, callback);
                            } else {
                                callback();
                            }
                        } else {
                            callback();
                        }
                    });
                } else {
                    // Notify if the fix method not provided
                    if (mandatoryField.notification) {
                        $this.notifyAboutInvalidResource(item, mandatoryField.notification, callback);
                    } else {
                        callback();
                    }
                }

            }, () => {
                var validationNotifications = [];

                async.series([callback => {
                    async.applyEachSeries($this.customValidators, item, validationNotifications, function (err) {
                        // @err is always undefined here

                        async.eachSeries(validationNotifications, function (validationNotification, callback) {

                            // Notify
                            $this.notifyAboutInvalidResource(item, validationNotification, callback);

                        }, callback);
                    });
                }, callback => {

                    $this.validateReferences(item, callback);

                }], () => {
                    /** Stream pause/resume can't be used in sync mode */
                    setTimeout(() => {
                        _flow.resume();
                        if (completed) {
                            return callback();
                        }
                    });
                });
            });

        }, () => {
            completed = true;
        }));
    }

    /**
     * Validate instance references
     *
     * @param item
     * @param callback
     */
    validateReferences(item, callback) {

        if (typeof callback !== 'function') callback = function () {
        };

        async.eachSeries(Object.keys(this.model.schema.paths), (path, callback) => {

            var field = this.model.schema.paths[path];

            if (field.instance === 'ObjectID' && field.options && field.options.ref && item[path]) {

                var Model = this.mongoose.model(field.options.ref);

                Model.findById(item[path]).exec((err, result) => {
                    if (err) {
                        console.log(err);
                        return callback();
                    }

                    if (!result) {
                        var notification = {
                            message: Model.modelName + ' has a broken reference to the ' + path,
                            notification_type: 'BROKEN_REFERENCE',
                            priority: 'danger'
                        };
                        return this.notifyAboutInvalidResource(item, notification, callback);
                    }

                    callback();
                });
            } else {
                callback();
            }
        }, callback);
    }

    /**
     * Remove all notifications for resource
     *
     * @param callback
     */
    clearNotifications(callback) {

        this.mongoose.model('notifications').find({
            resourceType: this.listName
        }, (err, items) => {
            if (err) return callback(err);

            async.eachLimit(items, 5, (item, callback) => {
                item.remove(callback);
            }, callback);
        });
    }

    /**
     * Notify about invalid resource
     *
     * @override
     * @param item - resource instance
     * @param notification
     * @param callback
     */
    notifyAboutInvalidResource(item, notification, callback) {
        callback();
    }
}

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
