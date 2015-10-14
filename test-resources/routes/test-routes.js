
// Using STRICT mode for ES6 features
"use strict";

module.exports = function () {
    var routes = {
        'all|/test-controller-usual': 'usual.js',
        'all|/test-controller-class': 'class.js',
        'all|/test-controller-handler': 'handler.js'
    };

    return routes;
};
