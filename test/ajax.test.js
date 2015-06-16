
/* global expect, ajax */
(function ( ) {
    "use strict";
    var URL, nock, server, id;

    URL = "http://localhost:3000";

    if (global.ENV === global.ENV_NODE) {
        global.ajax = require("../ajax");
        nock = require("nock");

        // xhr isnt going to exist at this point
        describe("missing support", function ( ) {
            it("should error without support", function ( ) {
                expect(function ( ) {
                    ajax(URL + "/respond/", {auto: false});
                }).to.throw(Error);
                // now polyfill!
                global.XMLHttpRequest = require("xhr2");
            });
        });

        // if we polyfill here support will exist before the first
        // test is run and the test will not throw the expected error

        // setup mock server
        id = (function ( ) {
            var _id = 0;
            return function ( ) { return _id++; };
        })( );

        before(function ( ) {
            server = nock(URL)
                .persist()

                .get("/respond/")
                .reply(200, "response")
                .get("/get_200/")
                .reply(200, "content")
                .get("/get_delay/")
                .delay(2000)
                .reply(200, "content")
                .get("/get_404/")
                .reply(404)
                .post("/post_200/", { a: 1, b: 2 })
                .reply(200, "content");
        });

        // clean up mock server
        after(function ( ) {
            nock.cleanAll();
        });
    }

    describe("environment", function ( ) {
        it("should have window", function ( ) {
            return expect(window).to.be.ok;
        });
        it("should have global", function ( ) {
            return expect(global).to.be.ok;
        });
        it("should have env", function ( ) {
            return expect(global.ENV).to.be.ok;
        });
    });

    describe("mock server", function ( ) {
        it("should respond", function ( done ) {
            ajax(URL + "/respond/").then(function ( data ) {
                data = expect(data).to.be.ok;
                done();
            }).catch(function ( status ) {
                throw new Error("unexpected status: " + status);
            });
        });
    });

    describe("argument normalization", function ( ) {
        it("should not accept no arguments", function ( ) {
            expect(function ( ) {
                ajax();
            }).to.throw(Error);
        });
        it("should accept string", function ( ) {
            expect(function ( ) {
                ajax(URL + "/get_200/");
            }).to.not.throw(Error);
        });
        it("should accept string, empty object", function ( ) {
            expect(function ( ) {
                ajax(URL + "/get_200/", { });
            }).to.not.throw(Error);
        });
        it("should not accept empty object", function ( ) {
            expect(function ( ) {
                ajax({ });
            }).to.throw(Error);
        });
        it("should accept object with url", function ( ) {
            expect(function ( ) {
                ajax({ url: URL + "/get_200/" });
            }).to.not.throw(Error);
        });
        it("should ignore unknown arugments", function ( ) {
            expect(function ( ) {
                ajax(URL + "/get_200/", { extra: 1, args: 2 });
            }).to.not.throw(Error);
        });
        it("should ignore extra arguments", function ( ) {
            expect(function ( ) {
                ajax(URL + "/get_200/", { }, 1, 2, 3);
            }).to.not.throw(Error);
        });
        it("should ignore non-string method", function ( ) {
            expect(function ( ) {
                ajax(URL + "/get_200/", { method: 1 });
            }).to.not.throw(Error);
        });
    });

    describe("callbacks", function ( ) {
        describe("where file exists", function ( ) {
            describe("then", function ( ) {
                it("should return content", function ( done ) {
                    ajax(URL + "/get_200/").then(function ( data ) {
                        expect(data).to.equal("content");
                        done();
                    });
                });
                it("should be cancelable", function ( done ) {
                    ajax(URL + "/get_delay/").cancel()
                    .then(function ( data ) {
                        throw new Error("unexpected data: " + data);
                    }, function ( status ) {
                        expect(status).to.equal(ajax.STATUS_ABORT);
                        done();
                    });
                });
                it("post should return content", function ( done ) {
                    ajax(URL + "/post_200/", {
                        method: ajax.METHOD_POST,
                        params: { a: 1, b: 2 }
                    }).then(function ( data ) {
                        expect(data).to.equal("content");
                        done();
                    }, function ( status ) {
                        throw new Error("unexpected status: " + status);
                    });
                });
                it("post malformed params should error", function ( done ) {
                    ajax(URL + "/post_200/", {
                        method: ajax.METHOD_POST,
                        params: { a: 1, b: 3 }
                    }).then(function ( data ) {
                        throw new Error("unexpected data: " + data);
                    }, function ( status ) {
                        expect(status).to.equal(0);
                        done();
                    });
                });
            });
            describe("catch", function ( ) {
                it("should not be called", function ( done ) {
                    ajax(URL + "/get_200/").then(done.bind(null, null),
                    function ( ) {
                        throw new Error("should not be called");
                    });
                });
            });

        });
        describe("where file does not exist", function ( ) {
            describe("then", function ( ) {
                it("should not be called", function ( done ) {
                    ajax(URL + "/get_404/").then(function ( ) {
                        throw new Error("should not be called");
                    }, done.bind(null, null));
                });
                it("should support error param", function ( done ) {
                    ajax(URL + "/get_404/").then(function ( ) {
                        throw new Error("should not be called");
                    }, done.bind(null, null));
                });
            });
            describe("catch", function ( ) {
                it("should have 404 status", function ( done ) {
                    ajax(URL + "/get_404/").catch(function ( status ) {
                        expect(status).to.equal(404);
                        done();
                    });
                });
            });
        });

    });

})( );

