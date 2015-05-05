
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

May be used as a class or function

> Note: It is highly recommended to use the new operator


```js
[new] Ajax("path/to/service").then(function ( data ) {
    // code...
});
```

Options may be provided after or with the url

```js
new Ajax("path/to/service", { /* options */ });

// --or--

new Ajax({
    url:    "path/to/service",
    method: Ajax.METHOD_GET,
    watch:  -1,
    params: {
        "key", "value",
        "...", "..."
    }
});
```

Possible methods are

```
Ajax.METHOD_GET
Ajax.METHOD_POST
Ajax.METHOD_PUT
Ajax.METHOD_UPDATE
Ajax.METHOD_DELETE
```

Callbacks loosely follow promise pattern

```js
new Ajax("path/to/service").then(function ( initial_data ) {
    // data code...
}).change(function ( changed_data ) {
    // update code...
}).error(function ( status ) {
    // error code...
});

// --or --

new Ajax("path/to/service").then(function ( initial_data ) {
    // code...
}, function( status ) {
    // error code...
});
```

A sent request may be canceled

```js
new Ajax("path/to/service").cancel()
```

A watched request may be paused or resumed

```js
// CAUTION: only initially watched items will have these methods

req = Ajax("path/to/service", { watch: 1000 });

// pause the current watcher
req.pause();

// restart the current watcher
req.resume();

// restart watcher with new delay of 500
req.resume(500);
```

noConflict method supplied when used globally

```js
Ajax = window.Ajax.noConflict();
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

