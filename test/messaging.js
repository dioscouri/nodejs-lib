
// Using STRICT mode for ES6 features
"use strict";

// Requiring core assert
var assert = require('assert');
var path = require('path');

/**
 * Requiring init script for main nodejs-lib
 *
 * @type {exports|module.exports}
 * @private
 */
var _init = require('./common/_init.js');

describe('DioscouriCore', function () {
    // Requiring core library
    var DioscouriCore = require('../index.js');

    // Describing core registry tests
    describe('Email', function () {

        // Core functionality
        it('Simple Mandrill Email Provider Workflow', function (done) {

            var mandrillEmailProvider = DioscouriCore.Messaging.EmailFactory.provider(DioscouriCore.Messaging.EmailProviderType.MANDRILL);
            assert.notEqual(mandrillEmailProvider);

            var emailMessage = new DioscouriCore.Messaging.EmailMessage({
                fromEmail: 'noreply@email.com',
                fromName: 'NOREPLY',
                subject: 'MVC Mandrill Messaging provider test',
                text: 'Mandrill Messaging provider test BODY'
            });
            emailMessage.addFileAttachment(__dirname + '/view.js', 'text/plain', 'view-test.js');
            emailMessage.addTo('ekalosha@dioscouri.com', 'Mr. Eugene A. Kalosha');
            mandrillEmailProvider.send(emailMessage, (error) => {
                done(error);
            });
        });

        it('Simple Sendgrid Email Provider Workflow', function (done) {

            var sendgridEmailProvider = DioscouriCore.Messaging.EmailFactory.provider(DioscouriCore.Messaging.EmailProviderType.SENDGRID);
            assert.notEqual(sendgridEmailProvider);

            var emailMessage = new DioscouriCore.Messaging.EmailMessage({
                fromEmail: 'noreply@email.com',
                fromName: 'NOREPLY',
                replyTo: {email: "no-reply@email.com", name: "Please do Not Reply"},
                subject: 'MVC Sendgrid Messaging provider test',
                html: 'Sendgrid Messaging provider test BODY<p>HTML</p>',
                text: 'Sendgrid Messaging provider test BODY',
                to: [
                    {email: "ekalosha@dioscouri.com", name: "Mr. Eugene A. Kalosha Jr"}
                ],
                cc: [
                    {email: 'rdiaztushman@dioscouri.com', name: 'Rafael Diaz-Tushman'}
                ]
            });
            emailMessage.addFileAttachment(__dirname + '/view.js', 'text/plain', 'view-test.js');
            emailMessage.addFileAttachment(__dirname + '/messaging-attacment.pdf', 'application/pdf', 'messaging-attacment.GEN.pdf');
            emailMessage.addTo('ekalosha@dioscouri.com', 'Mr. Eugene A. Kalosha');
            sendgridEmailProvider.send(emailMessage, (error) => {
                done(error);
            });
        });

    })
});
