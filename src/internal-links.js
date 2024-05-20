import Backbone from 'backbone';

var matchHttp = /^http/i;

/**
 * Create a view class. When instantiated, the view listens for click events in
 * `document.body` in order to capture visits to internal links. In this way,
 * they can be handled by the current SPA without causing the browser to reload
 * the page.
 * @param {typeof Backbone.View} [BaseView=typeof Backbone.View] Base class for
 * the new view type.
 * @param {Backbone.History} [history=Backbone.history] Instance of
 * `Backbone.History` to notify of link navigation.
 * @returns {typeof makeLinkEnabler~LinkEnabler} Class derived from `BaseView`.
 * @see {@link https://backbonejs.org/#View}
 * @see {@link https://backbonejs.org/#History}
 */
export default function makeLinkEnabler(BaseView, history) {
    BaseView = BaseView || Backbone.View;
    history = history || Backbone.history;

    /**
     * @class LinkEnabler
     * @extends Backbone.View
     */
    return BaseView.extend(/** @lends LinkEnabler.prototype */{

        // Rather than just stating `'body'` as the element, we dynamically
        // retrieve it in a function. This enables the class to be defined
        // before `document.body`.
        /** By default, the link enabler attaches itself to `document.body`. You
         * can override the `.el` or pass it as a constructor option in order to
         * restrict the enabler to a part of the page.
         * @see {@link https://backbonejs.org/#View-el} */
        el: function() {
            return document.body;
        },

        /** Do NOT override the events hash.
         * @see {@link https://backbonejs.org/#View-events} */
        events: {
            'click a, area': 'intercept',
        },

        /** Event handler that intercepts internal navigation, handling it with
         * `pushState` events instead of page reloads. You do not need to call
         * this method manually.
         * @see {@link https://backbonejs.org/#Router-navigate} */
        intercept: function(event) {
            var href = Backbone.$(event.currentTarget).attr('href');
            if (!href) return;
            if (href.slice(0, 2) === '//') return;
            if (matchHttp.test(href)) return;
            event.preventDefault();
            history.navigate(href, {trigger: true});
        },

        /** Does not remove the element, so you can safely call this method and
         * prevent memory leaks without accidentally deleting the whole page.
         * @override
         * @see {@link https://backbonejs.org/#View-remove} */
        remove: function() {
            return this.undelegateEvents().stopListening();
        }
    });
}
