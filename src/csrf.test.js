import assert from 'assert';
import sinon from 'sinon';

import _ from 'underscore';
import Backbone from 'backbone';
import Cookies from 'js-cookie';

import wrapWithCSRF from './csrf.js';

var myHeader = 'XYZ', myCookie = 'seasurfnugget', myToken = 'xyz123';

describe('wrapWithCSRF', function() {
    it('refuses zero argument calls', function() {
        assert.throws(wrapWithCSRF, TypeError);
    });

    it('refuses single argument calls', function() {
        assert.throws(_.partial(wrapWithCSRF, _.noop), TypeError);
    });

    it('refuses two argument calls', function() {
        assert.throws(_.partial(wrapWithCSRF, _.noop, myHeader), TypeError);
    });

    it('accepts three argument calls', function() {
        var wrapped = wrapWithCSRF(_.noop, myHeader, myCookie);
        assert(_.isFunction(wrapped));
    });

    it('is unaffected by a fourth argument', function() {
        var wrapped = wrapWithCSRF(_.noop, myHeader, myCookie, false);
        assert(_.isFunction(wrapped));
    });

    it('refuses non-functions as first argument', function() {
        var faulty = _.partial(wrapWithCSRF, myHeader, myHeader, myCookie)
        assert.throws(faulty, TypeError);
    });

    it('defaults to Backbone.sync if the first argument is null', function() {
        sinon.spy(Backbone, 'sync');
        var wrapped = wrapWithCSRF(null, myHeader, myCookie);
        assert(_.isFunction(wrapped));
        // We expect an exception because we don't tell Backbone.sync which URL
        // to visit.
        assert.throws(wrapped);
        assert(Backbone.sync.calledOnce);
        Backbone.sync.restore();
    });

    function assertRejectArgs(first, second, third) {
        var faulty = _.partial(wrapWithCSRF, first, second, third);
        assert.throws(faulty, TypeError);
    }

    it('refuses non-strings as second argument', function() {
        assertRejectArgs(_.noop, _.noop, myCookie);
    });

    it('refuses empty strings as second argument', function() {
        assertRejectArgs(_.noop, '', myCookie);
    });

    it('refuses non-strings as third argument', function() {
        assertRejectArgs(_.noop, myHeader, _.noop);
    });

    it('refuses empty strings as third argument', function() {
        assertRejectArgs(_.noop, myHeader, '');
    });

    describe('syncWithCSRF', function() {
        var magicReturnValue = 'abc';
        var absolute = '//';
        var http = 'http://';
        var HTTP = 'HTTP://';
        var https = 'https://';
        var origin = location.host;
        var otherHost = 'non' + origin;
        var path = '/user/login';
        var sync, syncCSRF, method, model, headers, options;

        before(function() {
            Cookies.set(myCookie, myToken);
        });

        after(function() {
            Cookies.remove(myCookie);
        });

        beforeEach(function() {
            sync = sinon.fake.returns(magicReturnValue);
            syncCSRF = wrapWithCSRF(sync, myHeader, myCookie);
            method = 'create';
            model = {id: 1, url: path};
            headers = {'x-requested-with': 'XMLHttpRequest'};
            options = {success: _.noop};
        });

        function makePristineCopies() {
            var _headers = _.clone(headers),
                _options = _.clone(options);
            if (_options && _options.headers) _options.headers = _headers;
            return {headers: _headers, options: _options};
        }

        function assertBasicPassthrough(pristine) {
            assert(sync.calledOnce);
            var matchOptions = sinon.match(pristine.options);
            assert(sync.calledWith(method, model, matchOptions));
        }

        function assertNoSideEffects(pristine) {
            assert.deepStrictEqual(options, pristine.options);
        }

        function assertHeaderAdded() {
            var passedOptions = sync.firstCall.args[2];
            assert(passedOptions.headers[myHeader] === myToken);
        }

        function assertHeaderNotAdded() {
            var passedOptions = sync.firstCall.args[2];
            assert(passedOptions === options);
            assert(
                !passedOptions ||
                !('headers' in passedOptions) ||
                !(myHeader in passedOptions.headers) ||
                passedOptions.headers[myHeader] !== myToken
            );
        }

        function completeCheck(headerCheck) {
            return function() {
                var pristine = makePristineCopies.call(this);
                var result = syncCSRF(method, model, options);
                assertBasicPassthrough.call(this, pristine);
                assert(result === magicReturnValue);
                headerCheck.call(this);
                assertNoSideEffects.call(this, pristine);
            };
        }

        var assertTransparentPassthrough = completeCheck(assertHeaderNotAdded),
            assertAugmentedPassthrough = completeCheck(assertHeaderAdded);

        describe('defaults to transparent passthrough...', function() {
            it('when no arguments are passed', function() {
                method = undefined;
                model = undefined;
                options = undefined;
                assertTransparentPassthrough.call(this);
            });

            it('when no url can be determined', function() {
                delete model.url;
                assertTransparentPassthrough.call(this);
            });

            it('when the method is "read", ...', function() {
                method = 'read';
                assertTransparentPassthrough.call(this);
            });

            it('regardless of whether model.url is function, ...', function() {
                method = 'read';
                model.url = _.constant(path);
                assertTransparentPassthrough.call(this);
            });

            it('or the url is passed as an option', function() {
                method = 'read';
                delete model.url;
                options.url = path;
                assertTransparentPassthrough.call(this);
            });

            it('when the options override the method to GET', function() {
                options.method = 'GET';
                assertTransparentPassthrough.call(this);
            });

            it('when the options override the method to HEAD', function() {
                options.method = 'HEAD';
                assertTransparentPassthrough.call(this);
            });

            it('when the url is on another host, ...', function() {
                model.url = absolute + otherHost + path;
                assertTransparentPassthrough.call(this);
            });

            it('including via http, ...', function() {
                model.url = http + otherHost + path;
                assertTransparentPassthrough.call(this);
            });

            it('and https, ...', function() {
                model.url = https + otherHost + path;
                assertTransparentPassthrough.call(this);
            });

            it('even if the scheme is in uppercase', function() {
                model.url = HTTP + otherHost + path;
                assertTransparentPassthrough.call(this);
            });
        });

        describe('injects CSRF header without side effects...', function() {
            _.each(['create', 'update', 'patch', 'delete'], function(override) {
                it('when the method is ' + override, function() {
                    method = override;
                    assertAugmentedPassthrough.call(this);
                });
            });

            _.each(['POST', 'PUT', 'PATCH', 'DELETE'], function(override) {
                it('when options.method is modifying', function() {
                    method = 'read';
                    options.method = override;
                    assertAugmentedPassthrough.call(this);
                });
            });

            _.each([absolute, http, https, HTTP], function(scheme) {
                it('when the url is same host with ' + scheme, function() {
                    options.url = scheme + origin + path;
                    assertAugmentedPassthrough.call(this);
                });
            });
        });
    });
});
