import _ from 'underscore';

var userMixin = {
    permissionsAttribute: 'permissions',
    registrationKeyName: 'key',

    login: function(credentials) {
        var user = this;
        return this.save(null, {
            url: this.loginUrl,
            method: 'POST',
            attrs: credentials,
            success: function(model, response) {
                user.trigger('login:success', user, response).fetch();
            },
            error: function(model, response) {
                user.trigger('login:error', user, response);
            },
        });
    },

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

    confirmRegistration: function(key) {
        var details = {};
        details[this.registrationKeyName] = key;
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

    hasPermission: function(permission) {
        var permissions = this.get(this.permissionsAttribute);
        if (!permissions) return false;
        return _.includes(permissions, permission);
    }
}

export default function getUserMixin(settings) {
    return _.extend({}, userMixin, settings);
}
