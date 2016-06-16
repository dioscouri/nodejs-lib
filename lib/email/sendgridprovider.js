// Using STRICT mode for ES6 features
"use strict";

/**
 * Require Sendgrid API implementation
 *
 * @type {exports|module.exports}
 */
var SendgridAPI = require('sendgrid');

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
 * Sendgrid email provider
 *
 * @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class SendgridProvider extends EmailProvider {

    /**
     * Provider constructor
     * @constructor
     */
    constructor (settings) {
        super(settings);

        // Set default API key from the ENV variable if one is not defined
        if (!this.apiKey && process.env.SENDGRID_APIKEY) {
            this.apiKey = process.env.SENDGRID_APIKEY
        }

        this._client = SendgridAPI;
    }

    /**
     * Overriding setter for settings.
     */
    set settings (value) {
        super.settings(value);

        if (this.settings != null) {
            this.apiKey = settings && settings.key ? settings.key : '';
        }
    }

    /**
     * Implements send process for email
     *
     * @param EmailMessage message
     * @param Function callback
     * @returns Promise
     */
    send (message, callback, modifyMassageHandler) {
        // Lets ensure that message is EmailMessage
        var emailMessage;
        if (message instanceof EmailMessage) {
            emailMessage = message;
        } else {
            emailMessage = new EmailMessage(message);
        }

        var SendgridMail = SendgridAPI.mail;

        var sendGridEmail = new SendgridMail.Mail();
        sendGridEmail.setFrom(new SendgridMail.Email(emailMessage.fromEmail, emailMessage.fromName));
        sendGridEmail.setSubject(emailMessage.subject);

        // Add emails map to ensure that emails are unique between to, cc and bcc.
        // This is due error 400:
        // {"errors":[{"message":"Each email address in the personalization block should be unique between to, cc, and bcc. We found the first duplicate instance of [ekalosha@dioscouri.com] in the personalizations.0.to field.","field":"personalizations.0","help":"http://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/errors.html#message.recipient-errors"}]}
        var emailsMap = {};

        // Define different personalization aspects
        var personalization = new SendgridMail.Personalization();
        for (var i = 0; i < emailMessage.to.length; i++) {
            if (emailsMap[emailMessage.to[i].email] != null) {
                continue;
            } else {
                emailsMap[emailMessage.to[i].email] = true;
            }
            personalization.addTo(new SendgridMail.Email(emailMessage.to[i].email, emailMessage.to[i].name));
        }
        for (var i = 0; i < emailMessage.cc.length; i++) {
            if (emailsMap[emailMessage.cc[i].email] != null) {
                continue;
            } else {
                emailsMap[emailMessage.cc[i].email] = true;
            }
            personalization.addCc(new SendgridMail.Email(emailMessage.cc[i].email, emailMessage.cc[i].name));
        }
        for (var i = 0; i < emailMessage.bcc.length; i++) {
            if (emailsMap[emailMessage.bcc[i].email] != null) {
                continue;
            } else {
                emailsMap[emailMessage.bcc[i].email] = true;
            }
            personalization.addBcc(new SendgridMail.Email(emailMessage.bcc[i].email, emailMessage.bcc[i].name));
        }
        personalization.setSubject(emailMessage.subject);
        for (var i = 0; i < emailMessage.headers.length; i++) {
            var header = emailMessage.headers[i];
            if (header.name && header.value) {
                personalization.addHeader(new SendgridMail.Header(header.name, header.value));
            }
            if (header.key && header.value) {
                personalization.addHeader(new SendgridMail.Header(header.key, header.value));
            }
            if (header[0] && header[1]) {
                personalization.addHeader(new SendgridMail.Header(header[0], header[1]));
            }
        }
        sendGridEmail.addPersonalization(personalization);

        // Set email content
        if (emailMessage.text) {
            sendGridEmail.addContent(new SendgridMail.Content("text/plain", emailMessage.text));
        }
        if (emailMessage.html) {
            sendGridEmail.addContent(new SendgridMail.Content("text/html", emailMessage.html));
        }
        for (var i = 0; i < emailMessage.attachments.length; i++) {
            var rawAttachment = emailMessage.attachments[i];

            var sendgridAttachment = new SendgridMail.Attachment();
            sendgridAttachment.setType(rawAttachment.type);
            sendgridAttachment.setFilename(rawAttachment.name);
            sendgridAttachment.setContent(rawAttachment.content);
            if (rawAttachment.disposition) {
                sendgridAttachment.setDisposition(rawAttachment.disposition);
            }
            if (rawAttachment.contentId) {
                sendgridAttachment.setContentId(rawAttachment.contentId);
            }

            sendGridEmail.addAttachment(sendgridAttachment);
        }

        if (emailMessage.replyTo && emailMessage.replyTo.email) {
            sendGridEmail.setReplyTo(new SendgridMail.Email(emailMessage.replyTo.email, emailMessage.replyTo.name))
        }

        // Emitting BEFORE_SEND event
        this.emit(EmailProvider.BEFORE_SEND, sendGridEmail);

        // Sending email via Sendgrid
        var sendgridClient = SendgridAPI.SendGrid(this.apiKey);

        var requestBody = sendGridEmail.toJSON();
        var requestPost = sendgridClient.emptyRequest();
        requestPost.method = 'POST';
        requestPost.path = '/v3/mail/send';
        requestPost.body = requestBody;
        sendgridClient.API(requestPost, function (response) {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                if (callback !== undefined){
                    callback(null, response);
                }
            } else {
                if (callback !== undefined){
                    callback(new Error("MAILER ERROR: Sendgrid error occurred: " + response.statusCode), response);
                }
            }
        });
    }
}

/**
 * Export Mandrill email provider
 *
 * @type {MandrillProvider}
 */
module.exports = SendgridProvider;
