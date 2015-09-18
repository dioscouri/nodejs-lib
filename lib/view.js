
// Using STRICT mode for ES6 features
"use strict";

/**
 * Requiring application Facade
 */
var applicationFacade = require('./facade.js').ApplicationFacade.instance;

/**
 * View types
 *
 * @type {{HTML: string, JSON: string, XML: string}}
 */
var ViewType = {
    HTML: 'HTML',
    JSON: 'JSON',
    XML: 'XML'
};

/**
 *  Base view. Handle different view types. Apply SWIG templates
 *
 *  @author Eugene A. Kalosha <ekalosha@dioscouri.com>
 */
class View {

    /**
     * Default view class
     *
     * @param {string} viewType
     * @param {{}} data
     * @param {string} template
     * @param {*} error
     */
    constructor (viewType, data, template, error) {
        /**
         * Requiring system logger
         *
         * @type {Logger|exports|module.exports}
         * @private
         */
        this._logger = require('./logger.js');

        this.data = data;
        this.viewType = viewType;
        this.template = template;
        this.error = error;
    }

    /**
     * Get View type
     *
     * @returns {string}
     */
    get viewType () {
        return this._viewType;
    }

    /**
     * Set View type
     *
     * @param {string} value
     */
    set viewType (value) {
        switch (value) {
            case ViewType.HTML:
            case ViewType.JSON:
            case ViewType.XML:
                this._viewType = value;
                break;

            default :
                if (this._viewType == null) {
                    this._viewType = ViewType.HTML;
                }
        }
    }

    /**
     * Get template file path. For html/xml views only.
     *
     * @returns {string}
     */
    get template () {
        return this._template;
    }

    /**
     * Set template path. For html/xml views only.
     *
     * @param {string} value
     */
    set template (value) {
        this._template = value;
    }

    /**
     * Get view data.
     *
     * @returns {{}}
     */
    get data () {
        return this._data;
    }

    /**
     * Set view data.
     *
     * @param {{}} value
     */
    set data (value) {
        this._data = value;
    }

    /**
     * Get current view error
     *
     * @returns {*|View.error}
     */
    get error () {
        return this._error;
    }

    /**
     * Get current view error
     *
     * @param {*} value
     */
    set error (value) {
        this._error = value;
    }

    /**
     * Get current SWIG Defaults
     *
     * @returns {{}}
     */
    get swigDefaults () {
        return this._swigDefaults;
    }

    /**
     * Get current SWIG Defaults
     *
     * @param {{}} value
     */
    set swigDefaults (value) {
        this._swigDefaults = value;
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
        var viewInstance = new View(ViewType.HTML, data, template, error);

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
        var viewInstance = new View(ViewType.JSON, data, null, error);

        return viewInstance;
    }

    /**
     * Render view output. If response specified - writes proper headers.
     * @param response
     * @returns {*}
     */
    render (response, request) {
        var result = null;

        if (request) {
            // Logged user
            this.data.loggedUser = request.user;
        }

        if (this.error == null) {
            var outputContent = '';
            var contentType = null;
            if (this.viewType == ViewType.HTML) {
                this._logger.debug('@@ Loading HTML View: %', this.template);

                // Requiring swig class
                var swig  = require('swig');

                // Initializing SWIG Defaults
                // TODO Optimize SWIG Initialization
                var swigDefaults = this.swigDefaults ? this.swigDefaults : {};
                if (applicationFacade.config.isDev) {
                    swigDefaults.cache = false;
                }

                // Creating separate SWIG Engine for Template parser
                var swigEngine = new swig.Swig(swigDefaults);
                var swigTemplate = swigEngine.compileFile(this.template);
                outputContent = swigTemplate(this.data);
                contentType = "text/html";

            } else if (this.viewType == ViewType.JSON) {
                outputContent = JSON.stringify(this.data);
                contentType = "application/json";
            }

            result = outputContent;

            // Set response
            if (response != null) {
                response.writeHead(200, {"Content-Type": contentType});
                response.write(outputContent);
            }
        } else {
            // Set response
            if (response != null) {
                response.writeHead(500, {"Content-Type": contentType});
                response.write(this.error);
            }
        }

        return result;
    }

};

/**
 * Exporting view classes
 */
module.exports.ViewType = ViewType;
module.exports.View = View;
