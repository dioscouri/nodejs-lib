
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
    describe('view', function () {
        // Initialization test
        it('View object must contain non Emty Filters Object', function (done) {
            assert.notEqual(DioscouriCore.View.filtersMap, null);

            done();
        });

        // Core functionality
        it('View object must store filters', function (done) {
            // Check valid filter
            DioscouriCore.View.setFilter('validFilter', function (value) {
                return 'Filtered: ' + value;
            });
            assert.notEqual(DioscouriCore.View.filtersMap['validFilter'], null);

            // Check remove filter
            DioscouriCore.View.removeFilter('validFilter');
            assert.equal(DioscouriCore.View.filtersMap['validFilter'], null);

            // Set invalid filter
            DioscouriCore.View.setFilter('invalidFilter', {invalidFilter: {}});
            assert.equal(DioscouriCore.View.filtersMap['invalidFilter'], null);

            // Set filter for Module View
            DioscouriCore.ModuleView.setFilter('validFilter2', function (value) {
                return 'Filtered: ' + value;
            });
            assert.notEqual(DioscouriCore.ModuleView.filtersMap['validFilter2'], null);

            DioscouriCore.ModuleView.removeFilter('validFilter2');
            assert.equal(DioscouriCore.ModuleView.filtersMap['validFilter2'], null);

            done();
        });

    })
});
