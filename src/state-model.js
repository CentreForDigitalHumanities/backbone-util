import _ from 'underscore';

var stateMixin = {
    preinitialize: function() {
        this.bindStateEvents();
    },

    bindStateEvents: function() {
        this.on('change', this.broadcastStateEvents);
    },

    broadcastStateEvents: function(model, options) {
        var current = this.attributes,
            previous = this.previousAttributes(),
            changed = this.changed;
        for (var attr in changed) {
            if (attr in previous) {
                this.trigger('exit:' + attr, this, previous[attr], options);
            } else {
                this.trigger('add:' + attr, this, current[attr], options);
            }
            if (attr in current) {
                this.trigger('enter:' + attr, this, current[attr], options);
            } else {
                this.trigger('remove:' + attr, this, previous[attr], options);
            }
        }
    }
};

function getStateMixin(options) {
    var mixin = stateMixin;
    if (options === false) {
        mixin = _.omit(mixin, 'preinitialize');
        options = null;
    }
    return _.extend({}, mixin, options);
}

export default getStateMixin;
