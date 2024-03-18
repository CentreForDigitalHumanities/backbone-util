import Backbone from 'backbone';

// Create a view class that derives from `BaseView`. `BaseView` defaults to
// `Backbone.View`. When instantiated, the view listens for click events
// everywhere in `document.body` in order to capture visits to internal links.
// These are handed off to `history` so they can be handled by the current SPA
// without causing the browser to reload the page. `history` defaults to
// `Backbone.history`.
export default function makeLinkEnabler(BaseView, history) {
    BaseView = BaseView || Backbone.View;
    history = history || Backbone.history;

    return BaseView.extend({
        // Rather than just stating `'body'` as the element, we dynamically
        // retrieve it in a function. This enables the class to be defined
        // before `document.body`.
        el: function() {
            return document.body;
        },
        events: {
            'click a, area': 'intercept',
        },
        // Our event handler: check whether we are navigating in-domain and if
        // so, handle it with a `pushState` event instead of allowing the
        // browser to reload the entire SPA.
        intercept: function(event) {
            var href = Backbone.$(event.currentTarget).attr('href');
            if (!href) return;
            if (href.slice(0, 2) === '//') return;
            if (href.slice(0, 4) === 'http') return;
            event.preventDefault();
            history.navigate(href, {trigger: true});
        },
        // Override `remove` so a user will not accidentally delete the entire
        // page.
        remove: function() {
            return this.undelegateEvents().stopListening();
        }
    });
}
