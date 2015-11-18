
// Using STRICT mode for ES6 features
"use strict";

// Requiring core assert
var assert = require('assert');

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
    describe('FlashMessages', function () {

        // Core functionality
        it('FlashMessages Workflow', function (done) {
            var request = {session: {}};
            var flashMessages = new DioscouriCore.FlashMessages(request);
            flashMessages.addMessage('First test Message!', DioscouriCore.FlashMessageType.SUCCESS);
            assert.equal(flashMessages.getMessages(false).length, 1);

            flashMessages.addMessage({message: 'Second test Message!', type: DioscouriCore.FlashMessageType.INFO});
            assert.equal(flashMessages.getMessages().length, 2);
            assert.equal(flashMessages.getMessages().length, 0);

            flashMessages.addMessages([{text: 'First test Message!', type: DioscouriCore.FlashMessageType.ERROR}, {message: 'Second test Message!', type: DioscouriCore.FlashMessageType.WARNING}]);
            assert.equal(flashMessages.getMessages().length, 2);
            assert.equal(flashMessages.getMessages().length, 0);

            done();
        });

    })
});
