import _ from 'underscore';
import { View } from 'backbone';

// The methods that we offer as a mixin. They can either be passed at class
// creation time as the `protoProps` argument to `View.extend`, or after the
// fact by extending the prototype. In either case, the constructor of the new
// class must call `this.enableAltClick` once during the constructor in order to
// bind the event handler.
var extensionMethods = {
    // Register the event handler. This must be called once in the constructor.
    enableAltClick: function() {
        if (window.DEBUGGING) {
            // We do not use `this.delegate` because we want the event to bubble
            // up to enclosing views.
            this.$el.on('click', this.logInfo.bind(this));
        }
        return this;
    },

    // The event handler that we want to attach.
    logInfo: function(event) {
        if (!event.altKey) return;
        console.log(this);
    }
};

// Return a shallow copy of the extension methods so that the original object
// cannot be tampered with.
export function getProtoProps() {
    return _.clone(extensionMethods);
}
