# `@uu-cdh/backbone-util/src/click-to-debug.js`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/click-to-debug.js)
[package README](../README.md)

> This module depends on jQuery, which is marked as an `optionalDependency` of `@uu-cdh/backbone-util`.

This module enables you to debug your live application by simply clicking on any view while keeping the alt (option, meta) key pressed. This logs the complete contents of the view to the developer console, so you can inspect its `model`, `collection`, `el`, `cid`, subviews, event listeners, etcetera. Ancestor views (i.e., views of which the `.el` envelops the `.el` of the clicked view) are logged as well. Three ingredients are needed to unlock this magic:

1. Obtain our [mixin](#alt-click-view-mixin) by calling the [`getAltClickMixin` function](#function-getaltclickmixin).
2. Define a common base class for all your views, which [has the mixin added in](using-mixins.md) and which calls `this.enableAltClick()` in its `initialize` method or `constructor`.
3. Set `window.DEBUGGING = true` at the start of your application (or omit this, if you want to disable the behavior in production).

``` javascript
import { View } from 'backbone';
import { getAltClickMixin } from '@uu-cdh/backbone-util'

// Use this as a common base for all your views
var MyBaseView = View.extend(_.extend(getAltClickMixin(), {
    initialize: function(options) {
        this.enableAltClick();
    },
    // Overriding the remove method is optional,
    remove: function() {
        // but this line prevents a memory leak.
        this.$el.off('click');
        return View.remove.call(this);
    }
}));

// Let's say you have a derived view type
var DocumentView = MyBaseView.extend({/*...*/});

// This view does not have the superpower
var aDocView = new DocumentView;

// Enabling the superpower for all views instantiated from now on
window.DEBUGGING = true;

// This view does have the superpower
var anotherDocView = new DocumentView;
```

## Function `getAltClickMixin`

**Default export** of `@uu-cdh/backbone-util/src/click-to-debug.js`, **reexported by name** from the package index.

**Parameters:** none

**Return value:** alt-click view mixin, described next

**Side effects:** none

## Alt-click view mixin

Plain object with two methods.

### Method `enableAltClick`

**Parameters:** none

**Return value:** `this` (so you can chain other view methods)

**Side effect:** registers `logInfo` (described next) as click event handler

This method should be called *exactly once* in the `initialize` method or `constructor` of the view with the mixin. Event handler registration operates outside of Backbone's standard `delegate`/`undelegate` mechanism. This has several consequences:

- You can safely define the `events` hash or method of a subview without interfering with the registration of the alt-click handler.
- The event handler stays active, even if you call `this.undelegateEvents()`.
- The event bubbles up and will also be captured by enveloping views that have the mixin enabled. For example, if you placed an `AnnotationView` inside a `PageView` inside a `DocumentView` and all those views derive from a common base that has the mixin enabled, alt-clicking on the inner `AnnotationView` will also log the contents of the `PageView` and the `DocumentView`. The innermost view is logged first.
- The event is not automatically unregistered when you call `.remove()`. You can address this by overriding the `remove` method and adding the line `this.$el.off('click')`.

### Method `logInfo`

**Parameter:** click event object with an `altKey` property

**Return value:** none

**Side effect:** logs the full contents of the view instance to the developer console.

This method purely exists as an event handler. There is no added value in calling it from your own code; if you want to trigger the behavior manually, simply call `console.log(this)`. We document the existence of this method only so that you can avoid having a method with the same name.
