// Using STRICT mode for ES6 features
"use strict";

/**
 * Require file system helper
 *
 * @type {*}
 */
var fs = require('fs');

/**
 * Require file path helper
 *
 * @type {*}
 */
var path = require('path');

/**
 * Base email message object
 *
 * @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class EmailMessage {

    /**
     * Email message constructor
     *
     * @param object message Original message object. Depends on a provider.
     */
    constructor (message) {
        this._raw = message || {};

        this._fromEmail = this._raw.from_email || this._raw.fromEmail;
        this._fromName = this._raw.from_name || this._raw.fromName;
        this._replyTo = this._raw.replyTo || {};
        this._to = this._raw.to || [];
        this._cc = this._raw.cc || [];
        this._bcc = this._raw.bcc || [];
        this._html = this._raw.html || null;
        this._text = this._raw.text || null;
        this._subject = this._raw.subject || '';
        this._attachments = this._raw.attachments || [];
        this._headers = this._raw.headers || [];
    }

    /**
     * Getter for fromEmail
     */
    get fromEmail () {
        return this._fromEmail;
    }

    /**
     * Setter for fromEmail
     *
     * @param value
     */
    set fromEmail (value) {
        this._fromEmail = value;
    }

    /**
     * Getter for fromName
     */
    get fromName () {
        return this._fromName;
    }

    /**
     * Setter for fromName
     *
     * @param value
     */
    set fromName (value) {
        this._fromName = value;
    }

    /**
     * Getter for TO:
     */
    get replyTo () {
        return this._replyTo;
    }

    /**
     * Getter for TO:
     */
    get to () {
        return this._to;
    }

    /**
     * Add TO: Address and/or Name
     *
     * @param email
     * @param name
     */
    addTo (email, name) {
        if (email != null) {
            this._to.push({"email": email, "name": name});
        }
    }

    /**
     * Getter for CC:
     */
    get cc () {
        return this._cc;
    }

    /**
     * Add CC: Address and/or Name
     *
     * @param email
     * @param name
     */
    addCC (email, name) {
        if (email != null) {
            this._cc.push({"email": email, "name": name});
        }
    }

    /**
     * Getter for BCC:
     */
    get bcc () {
        return this._bcc;
    }

    /**
     * Add BCC: Address and/or Name
     *
     * @param email
     * @param name
     */
    addBCC (email, name) {
        if (email != null) {
            this._bcc.push({"email": email, "name": name});
        }
    }

    /**
     * Getter for Headers list
     */
    get headers () {
        return this._headers;
    }

    /**
     * Add header to headers list
     *
     * @param headerString
     */
    addHeader (header) {
        if (header != null) {
            this._headers.push(header);
        }
    }

    /**
     * Getter for html
     */
    get html () {
        return this._html;
    }

    /**
     * Setter for html
     *
     * @param value
     */
    set html (value) {
        this._html = value;
    }

    /**
     * Getter for text
     */
    get text () {
        return this._text;
    }

    /**
     * Setter for text
     *
     * @param value
     */
    set text (value) {
        this._text = value;
    }

    /**
     * Getter for subject
     */
    get subject () {
        return this._subject;
    }

    /**
     * Setter for subject
     *
     * @param value
     */
    set subject (value) {
        this._subject = value;
    }

    /**
     * Getter for attachments list
     */
    get attachments () {
        return this._attachments;
    }

    /**
     * Add attachments to the list of attachments
     *
     * @param type Mime type of the attachment
     * @param name
     * @param content Usually content supposed to be Base64-Encoded string
     * @param disposition
     * @param contentId
     */
    addAttachment (type, name, content, disposition, contentId) {
        var attachment = {
            "type": type,
            "name": name,
            "content": content
        };
        if (disposition) {
            attachment.disposition = disposition;
        }
        if (contentId) {
            attachment.contentId = contentId;
        }
        this._attachments.push(attachment);
    }

    /**
     * Add attachments to the list of attachments
     *
     * @param filename full path to file
     * @param type Mime type of the attachment
     * @param name attachment name
     * @param disposition
     * @param contentId
     * @returns boolean
     */
    addFileAttachment (filename, mimeType, name, disposition, contentId) {
        if (!mimeType) {
            mimeType = 'application/octet-stream';
        }
        if (!name) {
            name = path.basename(filename);
        }

        try {
            var fileContentBuffer = fs.readFileSync(filename);
            var base64Content = fileContentBuffer.toString("base64");
            this.addAttachment(mimeType, name, base64Content, disposition, contentId);

            return true;
        } catch (exception) {
            this._logger.error("## EMAIL ATTACHMENT # Failed to attach file: " + filename);

            return false;
        }

    }

    /**
     * Getter for raw initial message
     */
    get raw () {
        return this._raw;
    }
}

/**
 * Export EmailMessage definition
 *
 * @type {EmailMessage}
 */
module.exports = EmailMessage;
