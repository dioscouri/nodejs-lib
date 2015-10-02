
// Using STRICT mode for ES6 features
"use strict";

/**
 * Module dependencies.
 */
var bcrypt = require('bcrypt-nodejs');

/**
 * Requiring base Model
 */
var com = {dioscouri: {core: {model: {mongo: {dbo: {}}}}}};
com.dioscouri.core.model.mongo.UserModel = require('../user.js');
var Types = com.dioscouri.core.model.mongo.UserModel.mongoose.Schema.Types;

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
var UserDBOSchema = com.dioscouri.core.model.mongo.UserModel.createSchema(schemaObject);

/**
 * Pre-save hook
 */
UserDBOSchema.pre('save', function (next) {
    var user = this;
    this.modifiedAt = Date.now();
    if (user.isModified('password')) {
        bcrypt.genSalt(10, function(err, salt) {
            if (err) {
                return next(err);
            }

            bcrypt.hash(user.password, salt, null, function(err, hash) {
                if (err) {
                    return next(err);
                }

                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

/**
 * Mongoose Virtual property for full name (first name and last name)
 */
UserDBOSchema.virtual('fullName').get(function () {
    return this.name.first + ' ' + this.name.last;
});

/**
 * Check is notification with specified type allowed for user
 */
UserDBOSchema.methods.isNotificationAllowed = function (notificationType) {
    var result = false;

    if (notificationType != null && this.notifications != null) {
        for (var i = 0; i < this.notifications.length; i++) {
            console.log(this.notifications);
            console.log(this.notifications[i]);
            if (this.notifications[i].toLowerCase() == notificationType.toLowerCase()) {
                return true;
            }
        }
    }

    return result;
};

/**
 * Compare password with currently set password
 *
 * @param candidatePassword
 * @param callback
 */
UserDBOSchema.methods.comparePassword = function (candidatePassword, callback) {
    var user = this;
    bcrypt.compare(candidatePassword, user.password, function(err, isMatch) {
        if (err) {
            return callback(err);
        } else {
            callback(null, isMatch);
        }
    });
}

/**
 * Exporting DBO Schema
 *
 * @type {Function}
 */
exports = module.exports = UserDBOSchema;
