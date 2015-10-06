
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring base view
 *
 * @type {exports|module.exports}
 */
var DioscouriView = require('../view.js');

/**
 * Requiring application Facade
 */
var applicationFacade = require('../facade.js').ApplicationFacade.instance;

/**
 * Requiring SWIG
 *
 * @type {*|exports|module.exports}
 */
var swig  = require('swig');

/**
 * Requiring core filesystem functions
 */
var fs = require('fs');

/**
 * Requiring core path functions
 */
var path = require('path');

/**
 *  Module view. Handle different view types. Apply SWIG templates
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class ModuleView extends DioscouriView.View {

    /**
     * Default view class
     *
     * @param {string} viewType
     * @param {{}} data
     * @param {string} template
     * @param {*} error
     */
    constructor (viewType, data, template, error) {
        super(viewType, data, template, error);

        var swigDefaults = {
            loader: this.getSwigTemplateLoader()
        };
        if (applicationFacade.config.isDev) {
            swigDefaults.cache = false;
        }
        this._swigEngine = new swig.Swig(swigDefaults);
    }

    /**
     * Creates HTML View for specified parameters
     *
     * @param template
     * @param data
     * @param error
     * @returns {View}
     */
    static htmlView (template, data, error) {
        var viewInstance = new ModuleView(DioscouriView.ViewType.HTML, data, template, error);

        return viewInstance;
    }

    /**
     * Creates JSON View for specified data
     *
     * @param data
     * @param error
     * @returns {View}
     */
    static jsonView (data, error) {
        var viewInstance = new ModuleView(DioscouriView.ViewType.JSON, data, null, error);

        return viewInstance;
    }

    /**
     * Returns template loader for SWIG Templates
     */
    getSwigTemplateLoader () {
        if (this._swigTemplateLoader == null) {
            /**
             * Create SWIG Template loader
             *
             * @param basepath
             * @param encoding
             * @returns {{}}
             * @private
             */
            this._swigTemplateLoader = function (basepath, encoding) {
                var templateLoader = {};
                var $this = this;

                encoding = encoding || 'utf8';
                basepath = (basepath) ? path.normalize(basepath) : null;

                /**
                 * Resolves <var>to</var> to an absolute path or unique identifier. This is used for building correct, normalized, and absolute paths to a given template.
                 * @alias resolve
                 * @param  {string} to        Non-absolute identifier or pathname to a file.
                 * @param  {string} [from]    If given, should attempt to find the <var>to</var> path in relation to this given, known path.
                 * @return {string}
                 */
                templateLoader.resolve = function (to, from) {
                    if (basepath) {
                        from = basepath;
                    } else {
                        from = (from) ? path.dirname(from) : $this.viewPath;
                    }

                    var fullPath = path.resolve(from, to);
                    if (!fs.existsSync(fullPath)) {
                        console.log('Full path is not exists, trying to resolve to parent: ' + fullPath);
                        fullPath = path.resolve(applicationFacade.basePath, to);
                    }
                    console.log('Target full path: ' + fullPath);

                    return fullPath;
                };

                /**
                 * Loads a single template. Given a unique <var>identifier</var> found by the <var>resolve</var> method this should return the given template.
                 * @alias load
                 * @param  {string}   identifier  Unique identifier of a template (possibly an absolute path).
                 * @param  {function} [callback]        Asynchronous callback function. If not provided, this method should run synchronously.
                 * @return {string}               Template source string.
                 */
                templateLoader.load = function (identifier, callback) {
                    if (!fs || (callback && !fs.readFile) || !fs.readFileSync) {
                        throw new Error('Unable to find file ' + identifier + ' because there is no filesystem to read from.');
                    }

                    identifier = templateLoader.resolve(identifier);

                    var templatePath = identifier.replace($this.viewPath, '');
                    console.log('Resolved template for tenant: %s', templatePath);
                    if (callback) {
                        fs.readFile(identifier, encoding, callback);

                        return;
                    } else {
                        // Read file in synchronous mode
                        return fs.readFileSync(identifier, encoding);
                    }
                };

                return templateLoader;
            }.bind(this);
        };

        // Returning Template loader based on SWIG
        return this._swigTemplateLoader();
    }
};

/**
 * Exporting view classes
 */
module.exports.ModuleView = ModuleView;