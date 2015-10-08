
// Using STRICT mode for ES6 features
"use strict";

// Requiring core assert
var assert = require('assert');

// Redefine default application environment
if (process.env.APPLICATION_ENV == null) {
    process.env.APPLICATION_ENV = 'test';
}

describe('DioscouriCore', function () {
    // Requiring core library
    var DioscouriCore = require('../index.js');

    // Describing core registry tests
    describe('registry', function () {
        // Initialization test
        it('Registry object must be initialized by default', function (done) {
            assert.notEqual(DioscouriCore.ApplicationFacade.instance.registry, null);

            done();
        });

        // Core functionality
        it('Registry object must store data', function (done) {
            DioscouriCore.ApplicationFacade.instance.registry.push('simpleObject', {uid: 'adf9-0498-ab98-b546'});
            DioscouriCore.ApplicationFacade.instance.registry.push('fromRequire', require('../package.json'));

            assert.equal(DioscouriCore.ApplicationFacade.instance.registry.load('simpleObject').uid, 'adf9-0498-ab98-b546');
            assert.notEqual(DioscouriCore.ApplicationFacade.instance.registry.load('fromRequire'), null);

            done();
        });

        // Testing access in different thread
        it('Registry object must be available in parallel thread', function (done) {
            setTimeout(function () {
                assert.equal(DioscouriCore.ApplicationFacade.instance.registry.load('fromRequire').name, 'dioscouri-core');

                done();
            }, 2);
        });

        // Testing exception
        it('Registry must throw exception in case of wrong key', function (done) {
            assert.throws(
                function() {
                    var wrongObject = DioscouriCore.ApplicationFacade.instance.registry.load('notDefinedObject');
                },
                function (error) {
                    if (error.name == 'Error.Loader') {
                        return true;
                    }
                },
                "Unexpected exception"
            );
            
            done();
        });
    })
});
