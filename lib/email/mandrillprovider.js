// Using STRICT mode for ES6 features
"use strict";

/**
 * Require Mandrill API implementation
 *
 * @type {exports|module.exports}
 */
var MandrillAPI = require('mandrill-api');

/**
 * Require abstract email provider implementation
 *
 * @type {EmailProvider|exports|module.exports}
 */
var EmailProvider = require('./emailprovider.js');

/**
 * Require email message
 *
 * @type {EmailProvider|exports|module.exports}
 */
var EmailMessage = require('./emailmessage.js');

/**
 * Mandrill email provider
 *
 * @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class MandrillProvider extends EmailProvider {

    /**
     * Mandrill API available field for email
     *
     * @returns {*[]}
     */
    static get API_FIELDS () {
        return [
            "html",
            "text",
            "subject",
            "from_email",
            "from_name",
            "to",
            "email",
            "name",
            "type",
            "headers",
            "important",
            "track_opens",
            "track_clicks",
            "auto_text",
            "auto_html",
            "inline_css",
            "url_strip_qs",
            "preserve_recipients",,
            "view_content_link",
            "bcc_address",
            "tracking_domain",
            "signing_domain",
            "return_path_domain",
            "merge",
            "merge_language",
            "global_merge_vars",
            "merge_vars",
            "tags",
            "subaccount",
            "google_analytics_domains",
            "google_analytics_campaign",
            "metadata",
            "recipient_metadata",
            "attachments",
            "images"
        ];
    }

    /**
     * Provider constructor
     * @constructor
     */
    constructor (settings) {
        super(settings);

        // Set default API key from the ENV variable if one is not defined
        if (!this.apiKey && process.env.MANDRILL_APIKEY) {
            this.apiKey = process.env.MANDRILL_APIKEY
        }

        this._client = new MandrillAPI.Mandrill(this.apiKey);
    }

    /**
     * Overriding setter for settings.
     */
    set settings (value) {
        super.settings(value);

        if (this.settings != null) {
            this.apiKey = settings && settings.key ? settings.key : '';
            this.async = settings && settings.async ? true : false;
            this.ipPool = settings && settings.ip_pool ? settings.ip_pool : null;
            this.sendAt = settings && settings.send_at ? settings.send_at : null;

            // Set API key if it is exists
            if (this.apiKey && this.client) {
                this.client.apikey = this.apiKey;
            }
        }
    }

    /**
     * Implements send process for email
     *
     * @param EmailMessage message
     * @param Function callback
     * @returns Promise
     */
    send (message, callback) {
        // Lets ensure that message is EmailMessage
        var emailMessage;
        if (message instanceof EmailMessage) {
            emailMessage = message;
        } else {
            emailMessage = new EmailMessage(message);
        }

        var mandrillMessageObject = {
            "html": emailMessage.html,
            "text": emailMessage.text,
            "subject": emailMessage.subject,
            "from_email": emailMessage.fromEmail,
            "from_name": emailMessage.fromName,
            "to": emailMessage.to
        };

        if (emailMessage.attachments && emailMessage.attachments.length > 0) {
            mandrillMessageObject.attachments = emailMessage.attachments;
        }
        if (emailMessage.headers && emailMessage.headers.length > 0) {
            mandrillMessageObject.headers = emailMessage.headers;
        }

        // Init custom RAW fields from the list
        for (var i = 0; i < this.API_FIELDS; i++) {
            var fieldName = this.API_FIELDS[i];

            if (mandrillMessageObject[fieldName] === null && emailMessage.raw[fieldName] !== null) {
                mandrillMessageObject[fieldName] = emailMessage.raw[fieldName];
            }
        }

        var parameters = {
            message: mandrillMessageObject
        };
        if (this.async != null) {
            parameters.async = this.async;
        }
        if (this.ipPool != null) {
            parameters.ip_pool = this.ipPool;
        }
        if (this.sendAt != null) {
            parameters.send_at = this.sendAt;
        }

        // Emitting BEFORE_SEND event
        this.emit(EmailProvider.BEFORE_SEND, mandrillMessageObject, parameters);

        // Sending email via Mandrill
        this.client.messages.send(parameters, (result) => {
            if (callback !== undefined){
                callback(null, result);
            }
        }, (error) => {
            this._logger.error('MAILER ERROR: Mandrill error occurred: ' + error.name + ' - ' + error.message);
            if (callback) {
                callback(error);
            }
        });
    }
}

/**
 * Export Mandrill email provider
 *
 * @type {MandrillProvider}
 */
module.exports = MandrillProvider;
