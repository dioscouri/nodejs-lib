
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring EmailMessage class definition
 *
 * @type {EmailMessage|exports|module.exports}
 */
var EmailMessage = require('./email/emailmessage.js');

/**
 * Requiring Mandrill email Provider definition
 *
 * @type {MandrillProvider|exports|module.exports}
 */
var MandrillProvider = require('./email/mandrillprovider.js');

/**
 * Requiring Sendgrid email Provider definition
 *
 * @type {SendgridProvider|exports|module.exports}
 */
var SendgridProvider = require('./email/sendgridprovider.js');

/**
 *  Email Factory abstraction
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class EmailFactory {

    /**
     * Returns default provider registered in the system
     *
     * @returns {EmailProvider}
     */
    static get defaultProvider () {
        var result = null;
        if (process.env.EMAIL_PROVIDER) {
            result = this.provider(process.env.EMAIL_PROVIDER);
        }
        return result;
    }

    /**
     * Get provider of registered type
     *
     * @param type
     * @returns class
     */
    static providerClass (type) {
        var ProviderClass;
        type = type.toUpperCase();
        if (type == EmailProviderType.SENDGRID) {
            ProviderClass = SendgridProvider;
        } else if (type == EmailProviderType.MANDRILL) {
            ProviderClass = MandrillProvider;
        } else {
            throw new Error("## MAILER ERROR # Provider for type " + type + " is not defined");
        }

        return ProviderClass;
    }

    /**
     * Get provider of registered type
     *
     * @param type
     * @returns {EmailProvider}
     */
    static provider (type) {
        var ProviderClass = this.providerClass(type);

        if (this._providersCache[type] == null) {
            this._providersCache[type] = new ProviderClass();
        }

        return this._providersCache[type];
    }
}

/**
 * Cache of providers
 *
 * @type {{}}
 * @private
 */
EmailFactory._providersCache = {};

/**
 * Email provider types
 *
 * @type {{MANDRILL: string, SENDGRID: string}}
 */
var EmailProviderType = {
    MANDRILL: "MANDRILL",
    SENDGRID: "SENDGRID"
};

/**
 * Export different message factories
 *
 * @type {EmailFactory}
 */
module.exports.EmailFactory = EmailFactory;
module.exports.EmailMessage = EmailMessage;
module.exports.EmailProviderType = EmailProviderType;
