
js-ajax [![Build Status](https://travis-ci.org/tsu-complete/js-ajax.svg?branch=master)](https://travis-ci.org/tsu-complete/js-ajax) [![Dependency Status](https://david-dm.org/tsu-complete/js-ajax.svg)](https://david-dm.org/tsu-complete/js-ajax) [![Documentation Coverage](http://inch-ci.org/github/tsu-complete/js-ajax.svg?branch=master)](http://inch-ci.org/github/tsu-complete/js-ajax?branch=master)
===

> Just another javascript ajax utility

[![Browser Support](https://ci.testling.com/tsu-complete/js-ajax.png)
](https://ci.testling.com/tsu-complete/js-ajax)

License
---

[![WTFPL](http://www.wtfpl.net/wp-content/uploads/2012/12/wtfpl-badge-1.png)](http://www.wtfpl.net)

Usage
---

Promise wrapper

Options may be provided after or with the url

```js
ajax("path/to/service", { /* options */ });

// --or--

ajax({
    url:    "path/to/service",
    method: ajax.METHOD_GET,
    watch:  -1,
    params: {
        "key", "value",
        "...", "..."
    }
});
```

Possible methods are

```
ajax.METHOD_GET
ajax.METHOD_POST
ajax.METHOD_PUT
ajax.METHOD_UPDATE
ajax.METHOD_DELETE
```

Returns a promise

```js
ajax("path/to/service").then(function ( data ) {
    // data code...
}).catch(function ( status ) {
    // error code...
});

// --or --

ajax("path/to/service").then(function ( data ) {
    // code...
}, function( status ) {
    // error code...
});
```

A request may be delayed
```js
var req = ajax("path/to/service", {auto:false});

// later...

req.send().then(...);
```

A sent request may be canceled

```js
ajax("path/to/service").cancel()
```

noConflict method supplied when used globally

```js
ajax = window.ajax.noConflict();
```

Linting
---

Linted with jshint

```js
$ npm run lint
```

Testing
---

Tested with testem

```bash
$ npm run test
```

Documentation
---

Documented with jsdoc

```bash
$ npm run docs
```

