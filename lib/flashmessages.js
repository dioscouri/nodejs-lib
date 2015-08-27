
// Using STRICT mode for ES6 features
"use strict";


/**
 * Application Events
 *
 * @type {{SERVER_STARTED: string, MONGO_CONNECTED: string}}
 */
var FlashMessageType = {
    INFO: 'info',
    SUCCESS: 'success',
    ERROR : 'danger',
    WARNING : 'warning'
};


/**
 *  Class that handles all work with flash messages
 *
 *  @author Lukas Polak <lpolak@dioscouri.com>
 */
class FlashMessages {

    /**
     * Constructor
     */
    constructor (request) {
        /**
         * Link to request object
         *
         * @private
         */
        this._request = request;
    }

    /**
     *  Adds message
     *
     * @param msg       Text of message
     * @param msgType   Type of message (info, error, warning, success)
     */
    addMessage (msg, msgType) {
        if( this._request == null ){
            return;
        }

        if( msgType === undefined ){
            msgType = FlashMessageType.INFO;
        }

        // check, if common dsc namespace is set in session
        if( this._request.session.dsc === undefined ){
            this._request.session.dsc = {}
        }

        // check, if any message was already defined
        if( this._request.session.dsc.msgs === undefined ){
            this._request.session.dsc.msgs = [];
        }

        switch( msgType ){
            case FlashMessageType.WARNING:
            case FlashMessageType.SUCCESS:
            case FlashMessageType.ERROR:
            {
                this._request.session.dsc.msgs.push({ text : msg, type : msgType });
                break;
            }
            case FlashMessageType.INFO:
            default:
            {
                this._request.session.dsc.msgs.push({ text : msg, type : FlashMessageType.INFO });
                break;
            }
        }
    }

    /**
     *  Returns all stored messages
     *
     *  @param flush    Erase messages afterwards
     *
     *  @return Object with all messages and their types (null, if there is no message)
     */
    getMessages(flush){
        if( this._request == null ){
            return null;
        }

        if( flush === undefined ) {
            flush = true;
        }

        // check, if common dsc namespace is set in session
        if( this._request.session.dsc === undefined ){
            return null;
        }

        // check, if any message was already defined
        if( this._request.session.dsc.msgs === undefined ){
            return null;
        }

        var result = this._request.session.dsc.msgs;

        if( flush ){ // should these messages be erased?
            this._request.session.dsc.msgs = [];
        }

        return result;
    }
}

module.exports.FlashMessages = FlashMessages;
module.exports.FlashMessageType = FlashMessageType;
