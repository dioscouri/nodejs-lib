
// Using STRICT mode for ES6 features
"use strict";

module.exports = function () {
    var routes = {
        'get,post|/': 'examples.js',
        'get|/examples': 'examples.js',
        'get,post|/examples/:action': 'examples.js'
    };

    return routes;
};
