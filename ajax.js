
(function ( factory ) {
    "use strict";

    var old;

    if ("function" === typeof define && define.amd) {
        define(factory);
    } else if ("undefined" !== typeof module) {
        module.exports = factory();
    } else {
        old = window.ajax;
        window.ajax = factory();

        /**
         * resets the old value at ajax and returns this one
         * @memberof ajax
         * @function noConflict
         * @return {Function} ajax
         */
        window.ajax.noConflict = function ( ) {
            var tmp;
            tmp = window.ajax;
            window.ajax = old;
            return tmp;
        };
    }

})(function ( ) {
    "use strict";

    var ajax, normalize, throwable, create_xhr;

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

        if ("boolean" !== typeof result.auto) {
            result.auto = true;
        }

        if ("string" !== typeof result.method) {
            result.method = ajax.METHOD_GET;
        }

        if ("string" !== typeof result.type) {
            result.type = ajax.TYPE_JSON;
        }

        result.params = Object(result.params);

        if ("string" !== typeof result.url) {
            throw throwable("argument required [url] as [string]");
        }

        return result;
    };

    /**
     * responsible for setting up and monitoring an xhr request
     * @function ajax
     * @param {(string|Object)} param1 url or configuration object
     * @param {Object} [param2] configuration object
     * @param {String} [param2.url] request location
     * @param {Boolean}[param2.auto=true] send request immediately
     * @param {String} [param2.method=get] xhr method
     * @param {String} [param2.type] specifies content type
     * @param {Object} [param2.params={}] parameters to send in request
     */
    ajax = function ( /* arguments */ ) {
        var data, key, xhr, promise;

        data = normalize(arguments);
        data.post = null;

        if (data.method !== ajax.METHOD_GET) {
            if (data.type === ajax.TYPE_JSON) {
                data.post = JSON.stringify(data.params);
            } else if (data.type === ajax.TYPE_URL_ENCODED) {
                data.post = "";

                for (key in data.params) {
                    data.post += "&" + key + "=" + data.params[key];
                }

                // clean up first character
                data.post = data.post.substr(1);
            }

        } else if (Object.keys(data.params).length) {
            if (!~data.url.indexOf("?")) {
                data.url += "?";
            }

            for (key in data.params) {
                data.url += "&" + key + "=" + data.params[key];
            }
        }

        // setup xhr
        xhr = create_xhr();

        // setup promise
        promise = new window.Promise(function ( accept, reject ) {
            xhr.accept = accept;
            xhr.reject = reject;

            xhr.onreadystatechange = function ( ) {
                if (4 !== this.readyState) {
                    return void 0;
                }

                if (200 === this.status) {
                    accept(this.responseText);
                } else {
                    reject(this.status);
                }
            };
        });

        /**
         * aborts current xhr call
         * @memberof ajax#
         * @function cancel
         * @return {Object} self context for chaining
         */
        promise.cancel = function (  ) {
            xhr.abort();
            xhr.reject(ajax.STATUS_ABORT);
            return promise;
        };

        /**
         * sends the xhr
         * @function send
         * @memberof ajax#
         */
        promise.send = function (  ) {
            var item;
            
            xhr.open(data.method, data.url, true);
            xhr.setRequestHeader("Content-Type", data.type);
            for (item in data.headers) {
                xhr.setRequestHeader(item, data.headers[item]);
            }
            for (item in data.passthrough) {
                if (item[0] === "!") {
                    xhr[item.substr(1)](data.passthrough[item.substr(1)]);
                } else {
                    xtr[item] = data.passthrough[item];
                }
            }
            xhr.send(data.post);
            return promise;
        };

        // send the request if auto
        if (data.auto) {
            promise.send();
        }

        return promise;
    };

    /**
     * defines the xhr get request method
     * @memberof ajax
     * @member {string}
     * @static
     */
    ajax.METHOD_GET     = "GET";
    /**
     * defines the xhr post request method
     * @memberof ajax
     * @member {string}
     * @static
     */
    ajax.METHOD_POST    = "POST";
    /**
     * defines the xhr put request method
     * @memberof ajax
     * @member {string}
     * @static
     */
    ajax.METHOD_PUT     = "PUT";
    /**
     * defines the xhr update request method
     * @memberof ajax
     * @member {string}
     * @static
     */
    ajax.METHOD_UPDATE  = "UPDATE";
    /**
     * defines the xhr delete request method
     * @memberof ajax
     * @member {string}
     * @static
     */
    ajax.METHOD_DELETE  = "DELETE";

    /**
     * defines the abort status
     * @memberof ajax
     * @member {Number}
     * @static
     */
    ajax.STATUS_ABORT = -1;
    /**
     * defines the success status
     * @memberof ajax
     * @member {Number}
     * @static
     */
    ajax.STATUS_SUCCESS = 200;
    /**
     * defines the not found status
     * @memberof ajax
     * @member {Number}
     * @static
     */
    ajax.STATUS_NOT_FOUND = 404;

    /**
     * defines the url encoded type
     * @memberof ajax
     * @member {String}
     * @static
     */
    ajax.TYPE_URL_ENCODED = "application/x-www-form-urlencoded";
    /**
     * defines the json type
     * @memberof ajax
     * @member {String}
     * @static
     */
    ajax.TYPE_JSON = "application/json";

    return ajax;

});

