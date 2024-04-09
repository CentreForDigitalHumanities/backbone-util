# `@uu-cdh/backbone-util/src/internal-links.js`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/internal-links.js)
[package README](../README.md)

This module makes it easy to pass `{pushState: true}` to [`Backbone.history.start`][bb-hist-start], scatter hyperlinks like `<a href="/document/1">first document</a>` throughout your HTML and have them handled automatically by your own [routers][bb-router], without causing the browser to reload the page. `<area>` tags work as well.

``` javascript
import { View, Router, history, $ } from 'backbone';
import { makeLinkEnabler } from '@uu-cdh/backbone-util';

var LinkEnabler = makeLinkEnabler();

// Keep this instance around as a global singleton.
var enableInternalLinks = new LinkEnabler;

var router = new Router({
    '/document(/:id)': function(id) {
        // This will happen when the user clicks the link.
        alert('You opened document ' + id);
    }
});

var IndexView = View.extend({
    render: function() {
        // Clicking this link will *not* reload the page.
        this.$el.html('<a href="/document/1">first document</a>');
        return this;
    }
});

$(function() {
    // Make Backbone recognize routes starting without a hash '#'.
    history.start({pushState: true});
    // Display the link to the user.
    new IndexView().render().$el.appendTo(document.body);
});
```

[bb-hist-start]: https://backbonejs.org/#History-start
[bb-router]: https://backbonejs.org/#Routing

## Function `makeLinkEnabler`

**Default export** of `@uu-cdh/backbone-util/src/internal-links.js`, **reexported by name** from the package index.

**Parameters:**

- `BaseView`, a subclass of `Backbone.View`. The returned "link enabler class" will derive from `BaseView`. Defaults to `Backbone.View` if omitted or `null`.
- `history`, an instance of (a subclass of) `Backbone.History`. The instance of the link enabler class will call `history.navigate` in order to hand off the hyperlink clicks to your routers. Defaults to `Backbone.history` if omitted or null.

**Return value:** link enabler class, a specialized view class, discussed below.

**Side effects:** none.

## Link enabler class

This class/constructor is obtained by calling `makeLinkEnabler`, discussed above.

This constructor is a view class, but for most intents and purposes, this fact may be regarded as an implementation detail. You just create a single instance without passing any arguments and keep that instance around. More about the instance in the next section.

You *could* pass the [`el` option][bb-view-el] to the constructor in order to restrict the hyperlink-intercepting magic to a particular element, rather than having it everywhere on the page. In this case, there might be merit in having multiple instances as well.

*Subclassing* the enabler class is unlikely to be useful. However, if you do, the `intercept` method is your most likely target of customization.

[bb-view-el]: https://backbonejs.org/#View-constructor

## Link enabler instance

This section discusses instances of the class discussed above.

You will rarely need to interact with this instance. However, the following methods and events are potentially useful to know about:

- `instance.undelegateEvents()` can be called in order to temporarily disable the link interception magic.
- `instance.delegateEvents()` can be called in order to re-enable the link interception magic.
- `instance.remove()` can be called if you stop using the enabler definitively. Don't worry, this will not remove the DOM element on which the behavior was attached.
- You can observe the usual `route` and `route:name` events on `history` and your routers in order to be notified of intercepted links.
