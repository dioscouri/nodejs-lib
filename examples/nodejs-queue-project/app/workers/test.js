module.exports = {
    uppercase: function (params, callback) {
        /** Pretend this is a long running job by setting a 1 second timeout */
        try {
            setTimeout(function () {
                if (params && params.text) {
                    var uppercase = params.text.toUpperCase();
                    console.log('Process UPPERCASE: %s', uppercase);
                    callback(null, { result_is: uppercase});
                } else {
                    callback(new Error('Params must be specified...'));
                }
            }, Math.floor(Math.random() * 1000) + 300);
        } catch (err) {
            callback(err);
        }
    },
    lowercase: function (params, callback) {
        /** Pretend this is a long running job by setting a 1 second timeout */
        try {
            setTimeout(function () {
                var uppercase = params.text.toLowerCase();
                console.log('Process LOWERCASE: %s', uppercase);
                callback(null, uppercase);
            }, Math.floor(Math.random() * 1000) + 300);
        } catch (err) {
            callback(err);
        }
    },
    test: function (params, callback) {
        /** Pretend this is a long running job by setting a 1 second timeout */
        try {
            setTimeout(function () {
                var result = "Now is: " + new Date();
                callback(null, result);
            }, Math.floor(Math.random() * 1000) + 300);
        } catch (err) {
            callback(err);
        }
    }
};
