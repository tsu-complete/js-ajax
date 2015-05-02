
/* global Ajax, expect */
(function ( ) {
    "use strict";
    var URL, nock, server, id;

    URL = "http://localhost";

    if (global.ENV === global.ENV_NODE) {
        global.Ajax = require("../ajax");

        // xhr isnt going to exist at this point
        describe("missing support", function ( ) {
            it("should error without support", function ( ) {
                expect(function ( ) {
                   new Ajax(URL + "/respond/");
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
            nock = require("nock");
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
                .reply(200, "content")
                .get("/get_watch/")
                .reply(200, function ( ) {
                    return "" + id();
                });
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
            new Ajax(URL + "/respond/").then(function ( data ) {
                data = expect(data).to.be.ok;
                done();
            }).error(function ( status ) {
                throw new Error("unexpected status: " + status);
            });
        });
    });

    describe("constructor", function ( ) {
        it("should accept new", function ( ) {
            expect(function ( ) {
                new Ajax(URL + "/get_200/");
            }).to.not.throw(Error);
        });
        it("should accept no new", function ( ) {
            expect(function ( ) {
                /* jshint -W064 */
                // reason: its actually a test :/
                Ajax(URL + "/get_200/");
                /* jshint +W064 */
            }).to.not.throw(Error);
        });
    });

    describe("argument normalization", function ( ) {
        it("should not accept no arguments", function ( ) {
            expect(function ( ) {
                new Ajax();
            }).to.throw(Error);
        });
        it("should accept string", function ( ) {
            expect(function ( ) {
                new Ajax(URL + "/get_200/");
            }).to.not.throw(Error);
        });
        it("should accept string, empty object", function ( ) {
            expect(function ( ) {
                new Ajax(URL + "/get_200/", { });
            }).to.not.throw(Error);
        });
        it("should not accept empty object", function ( ) {
            expect(function ( ) {
                new Ajax({ });
            }).to.throw(Error);
        });
        it("should accept object with url", function ( ) {
            expect(function ( ) {
                new Ajax({ url: URL + "/get_200/" });
            }).to.not.throw(Error);
        });
        it("should ignore unknown arugments", function ( ) {
            expect(function ( ) {
                new Ajax(URL + "/get_200/", { extra: 1, args: 2 });
            }).to.not.throw(Error);
        });
        it("should ignore extra arguments", function ( ) {
            expect(function ( ) {
                new Ajax(URL + "/get_200/", { }, 1, 2, 3);
            }).to.not.throw(Error);
        });
        it("should ignore non-string method", function ( ) {
            expect(function ( ) {
                new Ajax(URL + "/get_200/", { method: 1 });
            }).to.not.throw(Error);
        });
        it("should ignore non-numerical watch", function ( done ) {
            new Ajax(URL + "/get_200/", { watch: "test" })
            .change(function ( ) {
                throw new Error("should not be called");
            });
            setTimeout(done.bind(null, null), 400);
        });
    });

    describe("callbacks", function ( ) {
        describe("where file exists", function ( ) {
            describe("then", function ( ) {
                it("should return content", function ( done ) {
                    new Ajax(URL + "/get_200/").then(function ( data ) {
                        expect(data).to.equal("content");
                        done();
                    });
                });
                it("should be cancelable", function ( done ) {
                    new Ajax(URL + "/get_delay/").then(function ( data ) {
                        throw new Error("unexpected data: " + data);
                    }).error(function ( status ) {
                        expect(status).to.equal(-1);
                        done();
                    }).cancel();
                });
                it("post should return content", function ( done ) {
                    new Ajax(URL + "/post_200/", {
                        method: Ajax.METHOD_POST,
                        params: { a: 1, b: 2 }
                    })
                    .then(function ( data ) {
                        expect(data).to.equal("content");
                        done();
                    })
                    .error(function ( status ) {
                        throw new Error("unexpected status: " + status);
                    });
                });
                it("post malformed params should error", function ( done ) {
                    new Ajax(URL + "/post_200/", {
                        method: Ajax.METHOD_POST,
                        params: { a: 1, b: 3 }
                    })
                    .then(function ( data ) {
                        throw new Error("unexpected data: " + data);
                    })
                    .error(function ( status ) {
                        expect(status).to.equal(0);
                        done();
                    });
                });
            });
            describe("change", function ( ) {
                describe("without watch", function ( ) {
                    it("should not be called", function ( done ) {
                        new Ajax(URL + "/get_200/").change(function ( ) {
                            throw new Error("should not be called");
                        });
                        setTimeout(done.bind(null, null), 400);
                    });
                });
                describe("with watch", function ( ) {
                    it("should be resumable", function ( done ) {
                        var ajax, last;
                        ajax = new Ajax(URL + "/get_watch/", { watch: 200 })
                        .then(function ( data ) {
                            last = data;
                        })
                        .change(function ( change ) {
                            if (last === change) {
                                throw new Error("data was supposed to change");
                            }
                            last = change;
                        })
                        .error(function ( status ) {
                            throw new Error("unexpected status: " + status);
                        });
                        setTimeout(function ( ) {
                            ajax.pause();
                        }, 100);
                        setTimeout(function ( ) {
                            ajax.resume();
                            done();
                        }, 200);
                        setTimeout(function ( ) {
                            ajax.pause();
                        }, 800);
                    });
                    it("delay should be changable", function ( done ) {
                        var ajax;
                        ajax = new Ajax(URL + "/get_watch/", { watch: 200 })
                        .change(function ( ) {
                            throw new Error("should not be called");
                        }).resume(1000);
                        setTimeout(function ( ) {
                            ajax.pause();
                            done();
                        }, 800);
                    });
                    it("static should not be called", function ( done ) {
                        var ajax;
                        ajax = new Ajax(URL + "/get_200/", { watch: 200 })
                        .change(function ( ) {
                            throw new Error("should not be called");
                        });
                        setTimeout(function ( ) {
                            ajax.pause();
                            done();
                        }, 400);
                    });
                    it("dynamic should be called", function ( done ) {
                        var ajax, last;
                        ajax = new Ajax(URL + "/get_watch/", { watch: 200 })
                        .then(function ( data ) {
                            last = data;
                        })
                        .change(function ( change ) {
                            if (last === change) {
                                throw new Error("data was supposed to change");
                            }
                            last = change;
                        })
                        .error(function ( status ) {
                            throw new Error("unexpected status: " + status);
                        });
                        setTimeout(function ( ) {
                            ajax.pause();
                            done();
                        }, 1000);
                    });
                });
            });
            describe("error", function ( ) {
                it("should not be called", function ( done ) {
                    new Ajax(URL + "/get_200/").error(function ( ) {
                        throw new Error("should not be called");
                    }).then(done.bind(null, null));
                });
            });

        });
        describe("where file does not exist", function ( ) {
            describe("then", function ( ) {
                it("should not be called", function ( done ) {
                    new Ajax(URL + "/get_404/").then(function ( ) {
                        throw new Error("should not be called");
                    }).error(done.bind(null, null));
                });
                it("should support error param", function ( done ) {
                    new Ajax(URL + "/get_404/").then(function ( ) {
                        throw new Error("should not be called");
                    }, done.bind(null, null));
                });
            });
            describe("change", function ( ) {
                describe("without watch", function ( ) {
                    it("should not be called", function ( done ) {
                        new Ajax(URL + "/get_404/").change(function ( ) {
                            throw new Error("should not be called");
                        });
                        setTimeout(done.bind(null, null), 400);
                    });
                });
                describe("with watch", function ( ) {
                    it("should not be called", function ( done ) {
                        var ajax;
                        ajax = new Ajax(URL + "/get_404/", { watch: 200 })
                        .change(function ( ) {
                            throw new Error("should not be called");
                        });
                        setTimeout(function ( ) {
                            ajax.pause();
                            done();
                        }, 400);
                    });
                });
            });
            describe("error", function ( ) {
                it("should have 404 status", function ( done ) {
                    new Ajax(URL + "/get_404/").error(function ( status ) {
                        expect(status).to.equal(404);
                        done();
                    });
                });
            });
        });

    });

})( );

