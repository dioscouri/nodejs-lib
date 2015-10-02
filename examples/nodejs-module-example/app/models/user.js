
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring Core Library
 */
var DioscouriCore = require('dioscouri-core');

/**
 * Requiring base Model
 */
var BaseModel = require('./basemodel.js');

/**
 *  User model
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class UserModel extends BaseModel {
    /**
     * Model constructor
     */
    constructor (listName) {
        // We must call super() in child class to have access to 'this' in a constructor
        super(listName);
    }

    /**
     * Define Schema
     *
     * @override
     */
    defineSchema() {

        var Types = this.mongoose.Schema.Types;

        // User Schema Object
        var schemaObject = {
            "token": String,
            "password": String,
            "email": String,
            "isAdmin" : Boolean,
            "createdAt" : {type: Date, 'default': Date.now},
            "modifiedAt" : {type: Date, 'default': Date.now},
            "isVerified" : Boolean,
            "name": {
                "last": String,
                "first": String
            },
            notifications: []
        };

        /**
         * Creating DBO Schema
         */
        var UserDBOSchema = this.createSchema(schemaObject);

        // Registering schema and initializing model
        this.registerSchema(UserDBOSchema);
    }
}

/**
 * Creating instance of the model
 */
var modelInstance = new UserModel('user');

/**
 * Exporting Model
 *
 * @type {Function}
 */
exports = module.exports = modelInstance;
