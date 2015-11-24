'use strict';

/**
 * Async module
 * @type {async|exports|module.exports}
 */
var async = require('async');

/**
 * Base Controller
 *
 * @type {*|exports|module.exports}
 */
var BaseController = require('../controller.js').Controller;

/**
 * Base view
 * @type {*|View}
 */
var View = require('../view/view.js').View;

/**
 *  APIController controller
 */
class APIController extends BaseController {

    /**
     * Controller constructor
     */
    constructor(request, response) {
        // We must call super() in child class to have access to 'this' in a constructor
        super(request, response);

        /**
         * The default page size
         *
         * @type {number}
         * @private
         */
        this._defaultPageSize = 10;

        /**
         * The maximum page size
         *
         * @type {number}
         * @private
         */
        this._maxPageSize = 100;

        /**
         * Current API model instance
         *
         * @type {MongooseModel}
         * @private
         */
        this._model = null;

        /**
         * ApiKey model
         *
         * @type {MongooseModel}
         * @private
         */
        this._apiKeyModel = require('nodejs-admin').Admin.Models.APIKey;

        /**
         * Mongoose Population fields
         * url: {@link http://mongoosejs.com/docs/populate.html|Mongoose Doc}
         *
         * @type {string}
         * @private
         */
        this._modelPopulateFields = '';
    }

    /**
     * APIKey Model
     *
     * @returns {MongooseModel}
     */
    get apiKeyModel () {
        return this._apiKeyModel;
    }

    /**
     * Current model for CRUD
     *
     * @returns {MongooseModel}
     */
    get model () {
        return this._model;
    }

    /**
     * Current model populate fields
     * @returns {string}
     */
    get modelPopulateFields () {
        return this._modelPopulateFields;
    }

    /**
     * Current default page size
     * @returns Number
     */
    get defaultPageSize () {
        return this._defaultPageSize;
    }

    /**
     * Current maximum page size
     * @returns Number
     */
    get maxPageSize () {
        return this._maxPageSize;
    }

    /**
     * Returns view pagination
     *
     * @returns Number
     */
    getViewPageCurrent () {
        if (this.request.query && this.request.query.page) {
            return parseInt(this.request.query.page, 10);
        }
        return 1;
    }

    /**
     * Returns view page size
     *
     * @returns Number
     */
    getViewPageSize () {
        if (this.request.query && this.request.query.limit) {
            var limit = parseInt(this.request.query.limit, 10);

            if (limit > this.maxPageSize) {
                limit = this.maxPageSize;
            }

            if (limit === 0) {
                limit = 1;
            }

            return limit;
        }
        return this.defaultPageSize;
    }

    /**
     * Returns view pagination object
     *
     * @returns {{}}
     */
    getViewPagination () {
        return {
            currentPage: this.getViewPageCurrent(),
            pageSize: this.getViewPageSize()
        };
    }

    /**
     * Returns view filters
     *
     * @returns {{}}
     */
    getViewFilters () {
        var result = {
            search: {
                searchFields: [],
                searchValue: null
            }
        };
        if (this.model.responseFields) {
            this.model.responseFields.forEach(function (field) {
                if (this.request.query.filter && typeof this.request.query.filter[field] !== 'undefined') {
                    console.log("===================" + this.request.query.filter[field]);
                    result.search.searchFields.push(field);
                    result.search.searchValue = this.request.query.filter[field];
                }
            }.bind(this));
        }
        return result;
    }

    /**
     * Check API token
     *
     * @param readyCallback
     */
    preLoad (readyCallback) {
        async.waterfall([
            // Check if api_key exist
            function(callback) {
                if (!this.request.query.api_key) {
                    return callback(new Error('No API key provided'));
                }
                callback(null);
            }.bind(this),

            // Check api_key in DB
            function(callback) {
                this.apiKeyModel.authenticate(this.request.query.api_key, function (err, authenticated) {
                    if (err) {
                        return callback(err);
                    }
                    if (!authenticated) {
                        return callback(new Error('Invalid or non-active API key!'));
                    }
                    callback(null);
                });
            }.bind(this)
        ], function (error) {
            readyCallback(error);
        });
    }

    /**
     * Initialize load
     *
     * @param readyCallback
     */
    load (readyCallback) {
        if (this.request.params.id) {
            this.loadItem(readyCallback);
        } else {
            this.loadItems(readyCallback);
        }
    }

    loadItem (readyCallback) {
        var itemId = this.request.params.id.substring(0, 24);

        this.model.findById(itemId, function(err, item) {
            if (err) {
                this._logger.error(err);
                this.view(View.jsonView({error: 'Internal error'}, err));
                return readyCallback(err);
            }
            this.view(View.jsonView(item, null));
            readyCallback();
        }.bind(this));
    }

    loadItems (readyCallback) {
        var populations = this.modelPopulateFields;
        var pagination = this.getViewPagination();
        var filters = this.getViewFilters();

        this.model.getListFiltered(filters, populations, pagination, {}, function (error, data) {
            this.view(View.jsonView(data, error));
            readyCallback(error);
        }.bind(this));
    }
}

/**
 * Exporting Controller
 *
 * @type {Function}
 */
exports = module.exports = APIController;
