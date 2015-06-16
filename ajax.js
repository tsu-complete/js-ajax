
(function ( factory ) {
    "use strict";

    var old;

    if ("function" === typeof define && define.amd) {
        define(factory);
    } else if ("undefined" !== typeof module) {
        module.exports = factory();
    } else {
        old = window.Ajax;
        window.Ajax = factory();

        /**
         * resets the old value at ajax and returns this one
         * @memberof Ajax
         * @function noConflict
         * @return {Function} Ajax
         */
        window.Ajax.noConflict = function ( ) {
            var tmp;
            tmp = window.Ajax;
            window.Ajax = old;
            return tmp;
        };
    }

})(function ( ) {
    "use strict";

    var Ajax, __proto, normalize, throwable, create_xhr;

    throwable = function ( message ) {
        return new Error("ajax: " + message);
    };

    create_xhr = function ( ) {
        if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        throw throwable("request object not supported");
    };

    // argument normalization and sanity check
    normalize = function ( data ) {

        var result;

        // ignore extra arguments
        switch (Math.min(data.length, 2)) {
            case 1:
                if ("object" === typeof data[0]) {
                    result = data[0];
                } else if ("string" === typeof data[0]) {
                    result = { url: data[0] };
                } else {
                    result = { };
                }
                break;
            case 2:
                if ("string" === typeof data[0] &&
                    "object" === typeof data[1]) {
                    data[1].url = data[0];
                    result = data[1];
                } else {
                    result = { };
                }
                break;
            default:
                result = { };
        }


        result.method = String(result.method) || Ajax.METHOD_GET;

        result.watch = parseInt(result.watch);
        if (isNaN(result.watch)) { result.watch = -1; }

        result.params = Object(result.params);

        result.url = result.url;

        if (!result.url) {
            throw throwable("argument required: url");
        }

        return result;
    };

    /**
     * responsible for setting up and monitoring the xhr request
     * @class Ajax
     * @param {(string|Object)} param1 url or configuration object
     * @param {Object} [param2] configuration object
     * @param {string} [param2.url] request location
     * @param {string} [param2.method=get] xhr method
     * @param {number} [param2.watch=-1] duration between watch requests
     * @param {Object} [param2.params={}] parameters to send in request
     */
    Ajax = function ( /* arguments */ ) {
        var key;

        // for new haters
        if (!this || this === window) {
            return new Ajax(normalize(arguments));
        }

        this.data = normalize(arguments);
        this.data.post = null;

        if (Object.keys(this.data.params).length) {
            if (this.data.method !== Ajax.METHOD_GET) {
                this.data.post = "";

                for (key in this.data.params) {
                    this.data.post += "&" + key + "=" + this.data.params[key];
                }

                // clean up first character
                this.data.post = this.data.post.substr(1);

            } else  {
                if (!~this.data.url.indexOf("?")) {
                    this.data.url += "?";
                }

                for (key in this.data.params) {
                    this.data.url += "&" + key + "=" + this.data.params[key];
                }
            }
        }

        this._init_xhr();

        if (this.data.watch > -1) {
            this._init_watcher();
        }
    };

    /**
     * defines the xhr get request method
     * @memberof Ajax
     * @member {string}
     * @static
     */
    Ajax.METHOD_GET     = "GET";
    /**
     * defines the xhr post request method
     * @memberof Ajax
     * @member {string}
     * @static
     */
    Ajax.METHOD_POST    = "POST";
    /**
     * defines the xhr put request method
     * @memberof Ajax
     * @member {string}
     * @static
     */
    Ajax.METHOD_PUT     = "PUT";
    /**
     * defines the xhr update request method
     * @memberof Ajax
     * @member {string}
     * @static
     */
    Ajax.METHOD_UPDATE  = "UPDATE";
    /**
     * defines the xhr delete request method
     * @memberof Ajax
     * @member {string}
     * @static
     */
    Ajax.MOTHOD_DELETE  = "DELETE";


    __proto = Ajax.prototype;

    /**
     * initializes the xhr object
     * @memberof Ajax#
     * @private
     */
    __proto._init_xhr = function ( ) {
        var callbacks;

        this.xhr = create_xhr();

        this.xhr.last = null;

        callbacks = {
            then    : [ ]
        ,   change  : [ ]
        ,   error   : [ ]
        };

        /**
         * aborts a current xhr call
         * @memberof Ajax#
         * @function cancel
         * @return {Object} self context for chaining
         */
        this.cancel = function ( ) {
            this.xhr.abort();
            this.xhr.call("error", -1);
            return this;
        };

        /**
         * promise success callback
         * @memberof Ajax#
         * @function then
         * @param {Function} callback promise listener
         * @return {Object} self context for chaining
         */
        this.then = function ( callback, onerror ) {
            if ("function" === typeof callback) {
                callbacks.then.push(callback);
            } else {
                throw new TypeError(throwable.callback);
            }
            if ("function" === typeof onerror) {
                callbacks.error.push(onerror);
                // just ignore if onerror is not a function
            }
            return this;
        };

        /**
         * promise status callback
         * @memberof Ajax#
         * @function change
         * @param {Function} callback promise listener
         * @return {Object} self context for chaining
         */
        this.change = function ( callback ) {
            if ("function" === typeof callback) {
                callbacks.change.push(callback);
            } else {
                throw new TypeError(throwable.callback);
            }
            return this;
        };

        /**
         * promise error callback
         * @memberof Ajax#
         * @function error
         * @param {Function} callback promise listener
         * @return {Object} self context for chaining
         */
        this.error = function ( callback ) {
            if ("function" === typeof callback) {
                callbacks.error.push(callback);
            } else {
                throw new TypeError(throwable.callback);
            }
            return this;
        };

        this.xhr.call = function ( type, result ) {
            var i, ref;

            for (i in callbacks[type]) {
                if ("function" === typeof (ref = callbacks[type][i])) {
                    ref(result);
                }
            }
        };

        this.xhr.onreadystatechange = function ( ) {
            if (4 !== this.readyState) {
                return void 0;
            }

            if (200 === this.status) {
                this.last = this.responseText;
                this.call("then", this.last);
            } else {
                this.call("error", this.status);
            }
        };

        this.xhr.open(this.data.method, this.data.url, true);
        this.xhr.setRequestHeader("Content-Type",
            "application/x-www-form-urlencoded");
        this.xhr.send(this.data.post);
    };

    /**
     * updates the xhr object
     * @memberof Ajax#
     * @private
     */
    __proto._update_xhr = function ( ) {
        var old;

        old = this.xhr;

        this.xhr = create_xhr();

        this.xhr.last = old.last;
        this.xhr.call = old.call;

        this.xhr.onreadystatechange = function ( ) {
            if (4 !== this.readyState) {
                return void 0;
            }

            if (200 === this.status) {
                if (this.last !== this.responseText) {
                    this.call("change", this.responseText);
                    this.last = this.responseText;
                }
            } else {
                this.call("error", this.status);
            }
        };

        this.xhr.open(this.data.method, this.data.url, true);
        this.xhr.setRequestHeader("Content-Type",
            "application/x-www-form-urlencoded");
        this.xhr.send(this.data.post);
    };

    /**
     * initializes watcher
     * @memberof Ajax#
     * @private
     */
    __proto._init_watcher = function ( ) {
        var watch;

        watch = function ( ) {
            if (this.xhr.readyState === 4 && this.xhr.status === 200) {
                this._update_xhr();
            }
        }.bind(this);

        this.watcher = setInterval(watch, this.data.watch);

        /**
         * halts the watcher
         * @memberof Ajax#
         * @function pause
         * @return {Object} self context for chaining
         */
        this.pause = function ( ) {
            if (this.watcher) {
                clearInterval(this.watcher);
                this.watcher = null;
            }
            return this;
        };

        /**
         * resumes the watcher, possibly resetting delay period
         * @memberof Ajax#
         * @function resume
         * @param {number} [time] new time to watch at
         * @return {Object} self context for chaining
         */
        this.resume = function ( time ) {
            if (this.watcher) {
                clearInterval(this.watcher);
            }
            if ("number" === typeof time && time > 0) {
                this.data.watch = time;
            }
            this.watcher = setInterval(watch, this.data.watch);
            return this;
        };
    };

    return Ajax;

});

