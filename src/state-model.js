import _ from 'underscore';

/**
 * Methods that turn a `Backbone.Model` into a state model.
 * @mixin
 */
var StateMixin = {
    /** The default `preinitialize` calls `this.bindStateEvents()` so you don't
     * need to write that line. If you do write it yourself, you can omit or
     * override `preinitialize`. @see getStateMixin */
    preinitialize: function() {
        this.bindStateEvents();
    },

    /** Enables the specialized state model events. If you omit or override
     * {@link StateMixin.preinitialize}, call this method once in your own
     * constructor, `preinitialize` or `initialize` method. */
    bindStateEvents: function() {
        this.on('change', this.broadcastStateEvents);
    },

    /** Internal method, the heart of the mixin. For every changed attribute,
     * triggers appropriate`'set:'`, `'exit:'`, `'enter:'` and `'unset:'`
     * events. You do not need to call it yourself. Do NOT override. */
    broadcastStateEvents: function(model, options) {
        var current = this.attributes,
            previous = this.previousAttributes(),
            changed = this.changed;
        for (var attr in changed) {
            if (attr in previous) {
                this.trigger('exit:' + attr, this, previous[attr], options);
            } else {
                this.trigger('set:' + attr, this, current[attr], options);
            }
            if (attr in current) {
                this.trigger('enter:' + attr, this, current[attr], options);
            } else {
                this.trigger('unset:' + attr, this, previous[attr], options);
            }
        }
    }
};

/**
 * Acquire a shallow copy of {@link StateMixin} with optional customizations.
 * @param {Object} [options] Object with any properties and methods to add to
 * the mixin.
 * @param {boolean|Function} [options.preinitialize] As a special case, instead
 * of overriding {@link StateMixin.preinitialize}, you can also set this option
 * to `false` in order to omit the method from the mixin entirely.
 * @returns {StateMixin} Customized copy of {@link StateMixin}.
 */
function getStateMixin(options) {
    var mixin = StateMixin;
    if (options && options.preinitialize === false) {
        mixin = _.omit(mixin, 'preinitialize');
        options = _.omit(options, 'preinitialize');
    }
    return _.extend({}, mixin, options);
}

export default getStateMixin;
