import assert from 'assert';
import sinon from 'sinon';

import _ from 'underscore';
import { Model } from 'backbone';

import getUserMixin from './user-model.js';

var settings = {
    urlRoot: '/user',
    loginUrl: '/login',
    logoutUrl: '/logout',
    registerUrl: '/register',
    confirmRegistrationUrl: '/confirm'
};

var User = Model.extend(getUserMixin(settings));

var credentials = {
    username: 'john',
    password: 'hello123'
};
var userDetails = {
    username: 'john',
    id: '1',
    email: 'john@john.john'
};
var registerData = {
    username: credentials.username,
    password1: credentials.password,
    password2: credentials.password,
    email: userDetails.email
};
var registerKey = 'abc456';
var confirmData = {};
confirmData[User.prototype.registrationKeyName] = registerKey;

var jsonHeader = {'Content-Type': 'application/json'};

function respondJSON(request, status, data) {
    request.respond(status, jsonHeader, JSON.stringify(data));
}

describe('userMixin', function() {
    var user, xhr, eventWatcher, request, returnValue;

    beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        xhr.onCreate = function(fakeRequest) {
            request = fakeRequest;
        };
        eventWatcher = sinon.fake();
        user = new User;
        user.on('all', eventWatcher);
        assert(!request);
    });

    afterEach(function() {
        user.off().stopListening();
        request = null;
        xhr.restore();
    });

    describe('login', function() {
        beforeEach(function() {
            returnValue = user.login(credentials);
        });

        it('sends a POST request to the loginUrl', function() {
            assert(eventWatcher.calledWith('request'));
            assert(request);
            assert(request.method === 'POST');
            assert(request.url === settings.loginUrl);
            assert.deepStrictEqual(JSON.parse(request.requestBody), credentials);
        });

        it('returns the jqXHR promise', function() {
            assert(returnValue);
            assert(_.isFunction(returnValue.done));
            assert(_.isFunction(returnValue.fail));
            assert(_.isFunction(returnValue.state));
            assert(returnValue.state() === 'pending');
        });

        it('makes no changes before the response arrives', function() {
            assert(_.isEmpty(user.attributes));
        });

        describe('on success', function() {
            beforeEach(function() {
                respondJSON(request, 200, {id: userDetails.id});
                assert(returnValue.state() === 'resolved');
            });

            it('still does not save the credentials', function() {
                assert(!user.has('password'));
            });

            it('triggers a login:success event', function() {
                assert(eventWatcher.calledWith('login:success', user));
            });
        });

        describe('on failed validation', function() {
            beforeEach(function() {
                respondJSON(request, 401, {
                    detail: 'user does not exist or password invalid'
                });
                assert(returnValue.state() === 'rejected');
            });

            it('does not save anything to the model', function() {
                assert(_.isEmpty(user.attributes));
            });

            it('triggers a login:error event', function() {
                assert(eventWatcher.calledWith('login:error', user));
            });
        });

        describe('on network error', function() {
            beforeEach(function() {
                request.error();
                assert(returnValue.state() === 'rejected');
            });

            it('does not save anything to the model', function() {
                assert(_.isEmpty(user.attributes));
            });

            it('triggers a login:error event', function() {
                assert(eventWatcher.calledWith('login:error', user));
            });
        });
    });

    describe('logout', function() {
        beforeEach(function() {
            user.set(userDetails);
            returnValue = user.logout();
        });

        it('sends a POST request to the logoutUrl', function() {
            assert(eventWatcher.calledWith('request'));
            assert(request);
            assert(request.method === 'POST');
            assert(request.url === settings.logoutUrl);
        });

        it('returns the jqXHR promise', function() {
            assert(returnValue);
            assert(_.isFunction(returnValue.done));
            assert(_.isFunction(returnValue.fail));
            assert(_.isFunction(returnValue.state));
            assert(returnValue.state() === 'pending');
        });

        it('makes no changes before the response arrives', function() {
            sinon.assert.match(user.attributes, userDetails);
        });

        describe('on success', function() {
            beforeEach(function() {
                respondJSON(request, 200, {});
                assert(returnValue.state() === 'resolved');
            });

            it('triggers a logout:success event', function() {
                assert(eventWatcher.calledWith('logout:success', user));
            });

            it('erases the user data', function() {
                assert(_.isEmpty(user.attributes));
            });
        });

        describe('on failed authorization', function() {
            beforeEach(function() {
                respondJSON(request, 401, {
                    detail: 'not signed in'
                });
                assert(returnValue.state() === 'rejected');
            });

            it('does not change anything to the model', function() {
                sinon.assert.match(user.attributes, userDetails);
            });

            it('triggers a logout:error event', function() {
                assert(eventWatcher.calledWith('logout:error', user));
            });
        });

        describe('on network error', function() {
            beforeEach(function() {
                request.error();
                assert(returnValue.state() === 'rejected');
            });

            it('does not change anything to the model', function() {
                sinon.assert.match(user.attributes, userDetails);
            });

            it('triggers a logout:error event', function() {
                assert(eventWatcher.calledWith('logout:error', user));
            });
        });
    });

    describe('register', function() {
        beforeEach(function() {
            returnValue = user.register(registerData);
        });

        it('sends a POST request to the registerUrl', function() {
            assert(eventWatcher.calledWith('request'));
            assert(request);
            assert(request.method === 'POST');
            assert(request.url === settings.registerUrl);
            assert.deepStrictEqual(JSON.parse(request.requestBody), registerData);
        });

        it('returns the jqXHR promise', function() {
            assert(returnValue);
            assert(_.isFunction(returnValue.done));
            assert(_.isFunction(returnValue.fail));
            assert(_.isFunction(returnValue.state));
            assert(returnValue.state() === 'pending');
        });

        it('makes no changes before the response arrives', function() {
            assert(_.isEmpty(user.attributes));
        });

        describe('on success', function() {
            beforeEach(function() {
                respondJSON(request, 200, {id: userDetails.id});
                assert(returnValue.state() === 'resolved');
            });

            it('still does not save the registration data', function() {
                assert(!user.has('password1'));
            });

            it('triggers a registration:success event', function() {
                assert(eventWatcher.calledWith('registration:success'));
            });
        });

        describe('on failed validation', function() {
            beforeEach(function() {
                respondJSON(request, 400, {
                    detail: 'passwords do not match'
                });
                assert(returnValue.state() === 'rejected');
            });

            it('does not save anything to the model', function() {
                assert(_.isEmpty(user.attributes));
            });

            it('triggers a registration:error event', function() {
                assert(eventWatcher.calledWith('registration:error'));
            });
        });

        describe('on network error', function() {
            beforeEach(function() {
                request.error();
                assert(returnValue.state() === 'rejected');
            });

            it('does not save anything to the model', function() {
                assert(_.isEmpty(user.attributes));
            });

            it('triggers a registration:error event', function() {
                assert(eventWatcher.calledWith('registration:error'));
            });
        });
    });

    describe('confirmRegistration', function() {
        beforeEach(function() {
            returnValue = user.confirmRegistration(confirmData);
        });

        it('sends a POST request to the confirmRegistrationUrl', function() {
            assert(eventWatcher.calledWith('request'));
            assert(request);
            assert(request.method === 'POST');
            assert(request.url === settings.confirmRegistrationUrl);
            assert.deepStrictEqual(JSON.parse(request.requestBody), confirmData);
        });

        it('returns the jqXHR promise', function() {
            assert(returnValue);
            assert(_.isFunction(returnValue.done));
            assert(_.isFunction(returnValue.fail));
            assert(_.isFunction(returnValue.state));
            assert(returnValue.state() === 'pending');
        });

        it('makes no changes before the response arrives', function() {
            assert(_.isEmpty(user.attributes));
        });

        describe('on success', function() {
            beforeEach(function() {
                respondJSON(request, 200, {id: userDetails.id});
                assert(returnValue.state() === 'resolved');
            });

            it('still does not save the registration data', function() {
                assert(!user.has(registerKey));
            });

            it('triggers a confirm-registration:success event', function() {
                assert(eventWatcher.calledWith('confirm-registration:success'));
            });
        });

        describe('on failed validation', function() {
            beforeEach(function() {
                respondJSON(request, 400, {
                    detail: 'key does not match'
                });
                assert(returnValue.state() === 'rejected');
            });

            it('does not save anything to the model', function() {
                assert(_.isEmpty(user.attributes));
            });

            it('triggers a confirm-registration:error event', function() {
                assert(eventWatcher.calledWith('confirm-registration:error'));
            });
        });

        describe('on network error', function() {
            beforeEach(function() {
                request.error();
                assert(returnValue.state() === 'rejected');
            });

            it('does not save anything to the model', function() {
                assert(_.isEmpty(user.attributes));
            });

            it('triggers a confirm-registration:error event', function() {
                assert(eventWatcher.calledWith('confirm-registration:error'));
            });
        });
    });

    describe('hasPermission', function() {
        var permAttr = User.prototype.permissionsAttribute;
        var validPermission = 'createDocument';
        var candidates = ['__proto__', 'constructor', validPermission];

        it('returns false if the permission attribute is absent', function() {
            _.each(candidates, function(candidate) {
                assert(user.hasPermission(candidate) === false);
            });
        });

        it('returns false if the permission attribute is empty', function() {
            user.set(permAttr, []);
            _.each(candidates, function(candidate) {
                assert(user.hasPermission(candidate) === false);
            });
        });

        it('returns whether a permission is included', function() {
            user.set(permAttr, [validPermission]);
            _.each(candidates, function(candidate) {
                assert(user.hasPermission(candidate) === (
                    candidate === validPermission
                ));
            });
        });
    });
});
