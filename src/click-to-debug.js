import _ from 'underscore';
import { View } from 'backbone';

/**
 * View mixin that enables alt-click introspection. It can either be passed at
 * class creation time as the `protoProps` argument to [`View.extend`]{@link
   https://backbonejs.org/#View-extend}, or after the fact by extending the
 * prototype. In either case, the constructor of the new class must call
 * {@link AltClickMixin.enableAltClick} once.
 * @mixin
 */
var AltClickMixin = {
    /**
     * Register the event handler. This must be called once in the constructor.
     * @returns {this} The view to which this method is attached.
     */
    enableAltClick: function() {
        if (window.DEBUGGING) {
            // We do not use `this.delegate` because we want the event to bubble
            // up to enclosing views.
            this.$el.on('click', this.logInfo.bind(this));
        }
        return this;
    },

    /**
     * The event handler that takes care of alt-click introspection.
     * You do not need to invoke this yourself.
     */
    logInfo: function(event) {
        if (!event.altKey) return;
        console.log(this);
    }
};

// We return a shallow copy so that the original object cannot be tampered with.
/** Obtain a shallow copy of the alt-click mixin. @returns {AltClickMixin} */
export default function getAltClickMixin() {
    return _.clone(AltClickMixin);
}
