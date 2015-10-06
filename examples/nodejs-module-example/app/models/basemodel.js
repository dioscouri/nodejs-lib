
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring Core Library
 */
var DioscouriCore = require('dioscouri-core');

/**
 *  Base model
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class BaseModel extends DioscouriCore.MongooseModel {
    /**
     * Model constructor
     */
    constructor (listName) {
        // We must call super() in child class to have access to 'this' in a constructor
        super(listName);

        // Registering model ROOT
        this._modelRoot = DioscouriCore.ApplicationFacade.instance.basePath + '/app/models/';
    }
}

/**
 * Exporting Model
 *
 * @type {Function}
 */
exports = module.exports = BaseModel;
