import _ from 'underscore';

// Mixin with the methods needed to turn a regular `Backbone.Model` into a state
// model.
var stateMixin = {
    // By providing a ready `preinitialize` that calls `this.bindStateEvents`,
    // we can often save the user from having to write any additional code.
    preinitialize: function() {
        this.bindStateEvents();
    },

    // Attach our event handler that emits all the specialized events. This must
    // be called once during instance creation, in the constructor,
    // `preinitialize` or `initialize` method.
    bindStateEvents: function() {
        this.on('change', this.broadcastStateEvents);
    },

    // The heart of our mixin. For every changed attribute, trigger appropriate
    // `'set:'`, `'exit:'`, `'enter:'` and `'unset:'` events.
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

// Rather than exporting the raw mixin, we provide a getter function that
// creates a shallow clone and optionally customizes the methods. If `options`
// is `true` or omitted, return the mixin without adjustment. If `false`, omit
// the `preinitialize` method. If `options` is an object, use its properties as
// overrides.
function getStateMixin(options) {
    var mixin = stateMixin;
    if (options === false) {
        mixin = _.omit(mixin, 'preinitialize');
        options = null;
    }
    return _.extend({}, mixin, options);
}

export default getStateMixin;
