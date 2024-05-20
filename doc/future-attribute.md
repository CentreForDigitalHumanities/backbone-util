# `@uu-cdh/backbone-util/src/future-attribute.js`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/future-attribute.js)
[package README](../README.md)

This module provides two ways to postpone a callback until a specific attribute on a model switches from unset to set. The callback is scheduled or invoked immediately if the attribute is already set at the moment of querying. This saves you from writing an `if`/`else` every time a callback depends on the presence of an attribute that might or might not be already set.

```javascript
import { Model, View } from 'backbone';
import { when, whenever } from '@uu-cdh/backbone-util';

var BookModel = Model.extend({urlRoot: '/book'});
var bookInstance = new BookModel({id: 1});

bookInstance.fetch();
// This will take some time. In the meanwhile, we can already
// schedule some code:

when(bookInstance, 'title', function(book, title) {
    // This callback will run once, when the book has a title.
    alert('Fetched title for book "' + title + '"');
});

whenever(bookInstance, 'title', function(book, title) {
    // This callback will run when the book has a title, and
    // again every time the title changes.
    $('head title').text(title);
});
```

## Function `when`

**Named export** of `@uu-cdh/backbone-util/src/future-attribute.js`, **reexported by name** from the package index.

**Parameters:**

- `model`, the model instance on which you expect the attribute to appear.
- `attribute`, the name of the attribute that you expect to be eventually set.
- `handler`, the callback that should be invoked when the attribute is first set. It receives the same `(model, value, options)` arguments as a `model.on('change:attribute')` callback. `options` is an empty object if `attribute` was already set before `when` was called.
- `context`, optional `this` binding for the `handler`. If unspecified, `model` is used.

**Return value:** none

**Side effect:** either schedules the `handler` for a later cycle of the event loop, if the `attribute` is already set, or registers `handler` as a one-time event handler for `'change:attribute'`, if the `attribute` is not yet set. If `context` is defined and it implements the [`Events`][bb-events] interface, `context.listenToOnce` is used to register the handler, otherwise `model.once`.

It is important to realize that the `handler` *always runs async*, if it runs at all. In other words, it never runs before the call to `when` ends. This is one major difference from `whenever`, discussed next. The other major difference is that `handler` runs at most once, while `whenever` might cause it to run multiple times.

## Function `whenever`

**Named export** of `@uu-cdh/backbone-util/src/future-attribute.js`, **reexported by name** from the package index.

*The parameters and return value are identical to those of `when`.*

**Parameters:**

- `model`, the model instance on which you expect the attribute to appear.
- `attribute`, the name of the attribute that you expect to be eventually set.
- `handler`, the callback that should be invoked when the attribute is first set. It receives the same `(model, value, options)` arguments as a `model.on('change:attribute')` callback. `options` is an empty object if `attribute` was already set before `when` was called.
- `context`, optional `this` binding for the `handler`. If unspecified, `model` is used.

**Return value:** none

**Side effect:** `whenever(model, attribute, handler, context)` is roughly equivalent to `model.on('change:attribute', handler, context)`, or `context.listenTo(model, 'change:attribute', handler)` if `context` is defined and implements the [`Events`][bb-events] interface. The one major difference is that `handler` is *also* immediately invoked if the `attribute` is already set.

Contrary to `when`, if the `attribute` is already set, the `handler` is invoked *immediately*. It may also run more than once, if the `attribute` changes value after being first set.

[bb-events]: https://backbonejs.org/#Events
