import _ from 'underscore';

/**
 * Common prototype methods for a `Backbone.Model` subclass that represents a
 * user.
 * @see {@link https://backbonejs.org/#Model}
 * @mixin
 */
var UserMixin = {
    permissionsAttribute: 'permissions',

    /**
     * Send a login request to the authentication backend. Attach any data in
     * the response to the user model. Trigger a `login:success` or
     * `login:error` event as appropriate.
     * @param {Object} credentials - Key-value pairs needed to authenticate the
     * user, typically something of the form `{username, password}`.
     * @returns {Promise<Response>}
     */
    login: function(credentials) {
        var user = this;
        return this.save(null, {
            url: this.loginUrl,
            method: 'POST',
            attrs: credentials,
            success: function(model, response) {
                user.trigger('login:success', user, response);
            },
            error: function(model, response) {
                user.trigger('login:error', user, response);
            },
        });
    },

    /**
     * Send a logout request to the authentication backend. Reset the user model
     * on success. Trigger a `logout:success` or `logout:error` event as
     * appropriate.
     * @returns {Promise<Response>}
     */
    logout: function() {
        var user = this;
        return this.save(null, {
            url: this.logoutUrl,
            method: 'POST',
            success: function(model, response) {
                user.clear().trigger('logout:success', user, response);
            },
            error: function(model, response) {
                user.trigger('logout:error', user, response);
            },
        });
    },

    /**
     * Send a registration request to the authentication backend. Attach any
     * data in the response to the user model. Trigger a `registration:success`
     * or `registration:error` event as appropriate.
     * @param {Object} details - Key-value pairs needed to register the user,
     * such as username, email address and password.
     * @returns {Promise<Response>}
     */
    register: function(details) {
        var user = this;
        return this.save(null, {
            url: this.registerUrl,
            method: 'POST',
            attrs: details,
            success: function(model, response) {
                user.trigger('registration:success', user, response);
            },
            error: function(model, response) {
                user.trigger('registration:error', user, response);
            }
        });
    },

    /**
     * Send an email confirmation request to the authentication backend. Attach
     * any data in the response to the user model. Trigger a
     * `confirm-registration:success` or `confirm-registration:error` event as
     * appropriate.
     * @param {Object} details - Key-value pairs needed to authenticate the
     * user, typically just a confirmation code.
     * @returns {Promise<Response>}
     */
    confirmRegistration: function(details) {
        var user = this;
        return this.save(null, {
            url: this.confirmRegistrationUrl,
            method: 'POST',
            attrs: details,
            success: function(model, response) {
                user.trigger('confirm-registration:success', user, response);
            },
            error: function(model, response) {
                user.trigger('confirm-registration:error', user, response);
            }
        });
    },

    /**
     * Ask whether the user is authorized for a particular operation. This
     * method assumes that the user has an attribute with a list of permissions,
     * named by `this.permissionsAttribute`.
     * @param {*} permission - The permission to check. Most likely a string
     * with the name of the permission, but could be any type.
     * @returns {boolean} `true` if the user has the permission in question,
     * `false` otherwise.
     */
    hasPermission: function(permission) {
        var permissions = this.get(this.permissionsAttribute);
        if (!permissions) return false;
        return _.includes(permissions, permission);
    }
}

/**
 * Configure a shallow copy of {@link UserMixin}.
 * @param {Object} settings - Any additional methods and properties to add to
 * the mixin.
 * @param {string} settings.loginUrl - URL for the login endpoint, required if
 * you want to use {@link UserMixin.login}.
 * @param {string} settings.logoutUrl - URL for the logout endpoint, required if
 * you want to use {@link UserMixin.logout}.
 * @param {string} settings.registerUrl - URL for the user registration
 * endpoint, required if you want to use {@link UserMixin.register}.
 * @param {string} settings.confirmRegistrationUrl - URL for the email
 * confirmation endpoint, required if you want to use
 * {@link UserMixin.confirmRegistration}.
 * @returns {UserMixin} New object that includes all properties and methods of both `UserMixin` and `settings`.
 */
export default function getUserMixin(settings) {
    return _.extend({}, UserMixin, settings);
}
