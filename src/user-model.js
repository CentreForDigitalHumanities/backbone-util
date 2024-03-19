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
            success: function(model, response, options) {
                user.trigger('login:success', user).fetch();
            },
            error: function() {
                user.trigger('login:error', user)
            },
        });
    },

    logout: function() {
        var user = this;
        return this.save(null, {
            url: this.logoutUrl,
            method: 'POST',
            success: function() {
                user.clear().trigger('logout:success', user)
            },
            error: function() {
                user.trigger('logout:error', user)
            },
        });
    },

    register: function(details) {
        var user = this;
        return this.save(null, {
            url: this.registerUrl,
            method: 'POST',
            attrs: details,
            success: function(model, response, options) {
                user.trigger('registration:success', response.responseJSON);
            },
            error: function(model, response, options) {
                user.trigger('registration:error', response);
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
            success: function(model, response, options) {
                user.trigger('confirm-registration:success');
            },
            error: function(model, response, options) {
                user.trigger('confirm-registration:error', response);
            }
        });
    },

    hasPermission: function(permission) {
        let permissions = this.get(this.permissionsAttribute);
        if (!permissions) return false;
        return _.includes(permissions, permission);
    }
}

export default function getUserMixin(settings) {
    return _.extend({}, userMixin, settings);
}
