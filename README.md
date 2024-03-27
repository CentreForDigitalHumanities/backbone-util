# @uu-cdh/backbone-util

Various utilities for Backbone applications.

[Rationale](#rationale) | [Quickstart](#quickstart) | [Compatibility](#compatibility) | [Reference](#reference) | [Planned](#planned-features) | [Support](#support) | [Development](CONTRIBUTING.md) | [BSD 3-Clause](LICENSE)

## Rationale

We built several applications with a [Backbone][backbone] client. While writing those clients, we found ourselves repeating small patterns that were not yet abstracted by Backbone itself. We factored out those patterns and bundled them in this package, so that you can reuse them in your own Backbone single-page applications (SPAs). All of these utilities are small, independent additions to what Backbone can already do:

- a [view mixin](#module-click-to-debug) that causes the view to `console.log` its entire contents when alt-clicked, for easier debugging of the live application;
- a [`Backbone.sync` wrapper](#module-csrf) that automatically inserts a CSRF token header when sending a modifying request to the same origin, which is useful if (for example) you use [Django REST Framework][drf] with session authentication on the server side;
- [`when` and `whenever` functions](#module-future-attribute) that let you postpone code until an attribute is present on a model;
- a [very general `mixin` function](#module-mixin) that also copies non-enumerable properties, such as getters and setters;
- a model mixin that [adds finer-grained state change events](#module-state-model), which makes it suitable (for example) to act as an intermediary between router events and the placement of main page views;
- a [`Backbone.Model.url()` wrapper](#module-trailing-slash) that ensures URLs end with a slash, which is useful for server frameworks (such as Django) that are picky about it;
- a model mixin that [adds specific methods for user models](#module-user-model) such as `login`, `logout` and `register`, with matching events.

These utilities are well tested and we believe most Backbone applications can use at least a few of them.

We provide prototype mixins, rather than full-blown constructors/classes, because this gives you the freedom to layer them on top of a custom base class. This also leaves the choice up to you whether you want to use classic `Backbone.*.extend()` syntax or the modern `class`/ `super` keywords. We even have some tips in the quickstart below in case you want to combine Backbone with TypeScript.

[backbone]: https://backbonejs.org/
[drf]: https://www.django-rest-framework.org/

## Quickstart

We recommend a workflow in which you install dependencies from [npm](https://npmjs.com/) and bundle them with a tool such as Rollup.

``` bash
// could also use yarn, pnpm, etcetera
npm add @uu-cdh/backbone-util
```

``` javascript
import { View } from 'backbone';
import { getAltClickMixin } from '@uu-cdh/backbone-util';

export var MyBaseView = View.extend(getAltClickMixin());
// (See the reference for all the possible ways to use the library.)
```

You can also use the library directly from a browser embed, but you may need to set up [import maps][import-map] in that case.

### Using mixins

All of our mixins are supplied through a function. In some cases, this function enables you to customize the mixin. For example, the user model mixin requires that you supply some settings so that it knows where to send its requests:

``` javascript
import { getUserMixin } from '@uu-cdh/backbone-util';

var userMixin = getUserMixin({
    loginUrl: '/login',
    logoutUrl: '/logout',
    registerUrl: '/register',
    confirmRegistrationUrl: '/confirm'
});
```

Once you have created the mixin, using it with Backbone's trusty old class emulation is as simple as passing it as the first argument to the `extend` method:

``` javascript
import { Model } from 'backbone';

var MyUserModel = Model.extend(userMixin);
```

Alternatively, use modern `class` syntax and add the mixin to the prototype using Underscore's `_.extend`, `Object.assign` or our own [mixin](#module-mixin):

``` javascript
import { extend } from 'underscore';

class MyUserModel extends Model {}
extend(MyUserModel.prototype, userMixin);
```

You can also take this approach with Backbone's classic `.extend`.

If you are using TypeScript, you may need [declaration merging][ts-mixin] and some additional type annotations:

``` typescript
import getUserMixin, { User } from '@uu-cdh/backbone-util/src/user-model.js';

interface MyUserModel extends User {}
class MyUserModel extends Model {}
extend(MyUserModel.prototype, userMixin);
```

[import-map]: https://developer.mozilla.org/docs/Web/HTML/Element/script/type/importmap
[ts-mixin]: https://www.typescriptlang.org/docs/handbook/mixins.html

## Compatibility

The code modules use modern `import`/`export` syntax. If your target environment does not support this, you will need to take the code through a conversion or bundling tool first. Otherwise, only syntax is used that has existed for a while, so no transpilation or polyfilling should be required.

## Reference

### Module `click-to-debug`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/click-to-debug.js)

> This module depends on jQuery, which is marked as an `optionalDependency` of `@uu-cdh/backbone-util`.

This module enables you to debug your live application by simply clicking on any view while keeping the alt (option, meta) key pressed. This logs the complete contents of the view to the developer console, so you can inspect its `model`, `collection`, `el`, `cid`, subviews, event listeners, etcetera. Ancestor views (i.e., views of which the `.el` envelops the `.el` of the clicked view) are logged as well. Three ingredients are needed to unlock this magic:

1. Obtain our [mixin](#alt-click-view-mixin) by calling the [`getAltClickMixin` function](#function-getaltclickmixin).
2. Define a common base class for all your views, which [has the mixin added in](#using-mixins) and which calls `this.enableAltClick()` in its `initialize` method or `constructor`.
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

#### Function `getAltClickMixin`

**Default export** of `@uu-cdh/backbone-util/src/click-to-debug.js`, **reexported by name** from the package index.

**Parameters:** none

**Return value:** alt-click view mixin, described next

**Side effects:** none

#### Alt-click view mixin

Plain object with two methods.

##### Method `enableAltClick`

**Parameters:** none

**Return value:** `this` (so you can chain other view methods)

**Side effect:** registers `logInfo` (described next) as click event handler

This method should be called *exactly once* in the `initialize` method or `constructor` of the view with the mixin. Event handler registration operates outside of Backbone's standard `delegate`/`undelegate` mechanism. This has several consequences:

- You can safely define the `events` hash or method of a subview without interfering with the registration of the alt-click handler.
- The event handler stays active, even if you call `this.undelegateEvents()`.
- The event bubbles up and will also be captured by enveloping views that have the mixin enabled. For example, if you placed an `AnnotationView` inside a `PageView` inside a `DocumentView` and all those views derive from a common base that has the mixin enabled, alt-clicking on the inner `AnnotationView` will also log the contents of the `PageView` and the `DocumentView`. The innermost view is logged first.
- The event is not automatically unregistered when you call `.remove()`. You can address this by overriding the `remove` method and adding the line `this.$el.off('click')`.

##### Method `logInfo`

**Parameter:** click event object with an `altKey` property

**Return value:** none

**Side effect:** logs the full contents of the view instance to the developer console.

This method purely exists as an event handler. There is no added value in calling it from your own code; if you want to trigger the behavior manually, simply call `console.log(this)`. We document the existence of this method only so that you can avoid having a method with the same name.

### Module `csrf`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/csrf.js)

> This module depends on `js-cookie`, which is marked as an `optionalDependency` of `@uu-cdh/backbone-util`.

This module provides a wrapper for [`Backbone.sync`][bb-sync] that automatically adds the [CSRF][csrf] token header to modifying, same-origin requests. This is useful if the backend uses session authentication (which is the default for frameworks such as [Django][django]). The wrapped function can be used as a drop-in replacement for `Backbone.sync`. You can also wrap another function with the same interface as `Backbone.sync`. In this way, you could create a version of `sync` with multiple layers of extensions.

``` javascript
import Backbone from 'backbone';
import { wrapWithCSRF } from '@uu-cdh/backbone-util';

// In this case, we override the sync method for the entire
// application, but you could also override it only for particular
// model or collection classes. See the next section for the meaning
// of the arguments.
Backbone.sync = wrapWithCSRF(null, 'X-CSRFToken', 'csrftoken');
```

#### Function `wrapWithCSRF`

**Default export** of `@uu-cdh/backbone-util/src/csrf.js`, **reexported by name** from the package index.

**Parameters:**

- `sync`, the implementation of [`Backbone.sync`][bb-sync] that you want to extend. The original `Backbone.sync` is automatically used as a fallback if you pass `null` or `undefined`.
- `header`, nonempty string with the name of the request header that should contain the CSRF token. There is no default value; consult the documentation of your backend framework on what it should be. In case of uncertainty, try `X-CSRFToken`.
- `cookie`, the name of the cookie that contains the CSRF token. There is no default value; consult the documentation of your backend framework on what it should be. In case of uncertainty, try `csrftoken`.

**Return value:** a new function with the same interface as `Backbone.sync`, described next

**Side effects:** none

#### `sync`-like function with CSRF header insertion

This function is obtained by calling `wrapWithCSRF`, described above.

**Parameters:** identical to those of [`Backbone.sync`][bb-sync]: `method`, `model`, `options`.

**Return value:** identical to that of the `sync` function that was passed as the first argument to `wrapWithCSRF`. This is generally a promise-like interface, most likely a [`jQuery.jqXHR`][jq-xhr].

**Side effect:** *almost* identical to that of the `sync` function that was passed as the first argument to `wrapWithCSRF`. Generally, an `XMLHttpRequest` is sent (there is no point in adding a CSRF token header otherwise). The response determines the resolution of the returned promise. The only difference with the underlying `sync` function is that a request header with the CSRF token is added under the following conditions:

- `method` is not `'read'`.
- `options.method` is not `'GET'` or `'HEAD'` (it can be unset).
- The request URL is on the same host as the current Backbone application.

[bb-sync]: https://backbonejs.org/#Sync
[csrf]: https://en.wikipedia.org/wiki/Cross-site_request_forgery#Cookie-to-header_token
[django]: https://www.djangoproject.com/
[jq-xhr]: https://api.jquery.com/jQuery.ajax/#jqXHR

### Module `future-attribute`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/future-attribute.js)

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

#### Function `when`

**Named export** of `@uu-cdh/backbone-util/src/future-attribute.js`, **reexported by name** from the package index.

**Parameters:**

- `model`, the model instance on which you expect the attribute to appear.
- `attribute`, the name of the attribute that you expect to be eventually set.
- `handler`, the callback that should be invoked when the attribute is first set. It receives the same `(model, value, options)` arguments as a `model.on('change:attribute')` callback. `options` is an empty object if `attribute` was already set before `when` was called.
- `context`, optional `this` binding for the `handler`. If unspecified, `model` is used.

**Return value:** none

**Side effect:** either schedules the `handler` for a later cycle of the event loop, if the `attribute` is already set, or registers `handler` as a one-time event handler for `'change:attribute'`, if the `attribute` is not yet set. If `context` is defined and it implements the [`Events`][bb-events] interface, `context.listenToOnce` is used to register the handler, otherwise `model.once`.

It is important to realize that the `handler` *always runs async*, if it runs at all. In other words, it never runs before the call to `when` ends. This is one major difference from `whenever`, discussed next. The other major difference is that `handler` runs at most once, while `whenever` might cause it to run multiple times.

#### Function `whenever`

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

### Module `internal-links`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/internal-links.js)

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

#### Function `makeLinkEnabler`

**Default export** of `@uu-cdh/backbone-util/src/internal-links.js`, **reexported by name** from the package index.

**Parameters:**

- `BaseView`, a subclass of `Backbone.View`. The returned "link enabler class" will derive from `BaseView`. Defaults to `Backbone.View` if omitted or `null`.
- `history`, an instance of (a subclass of) `Backbone.History`. The instance of the link enabler class will call `history.navigate` in order to hand off the hyperlink clicks to your routers. Defaults to `Backbone.history` if omitted or null.

**Return value:** link enabler class, a specialized view class, discussed below.

**Side effects:** none.

#### Link enabler class

This class/constructor is obtained by calling `makeLinkEnabler`, discussed above.

This constructor is a view class, but for most intents and purposes, this fact may be regarded as an implementation detail. You just create a single instance without passing any arguments and keep that instance around. More about the instance in the next section.

You *could* pass the [`el` option][bb-view-el] to the constructor in order to restrict the hyperlink-intercepting magic to a particular element, rather than having it everywhere on the page. In this case, there might be merit in having multiple instances as well.

*Subclassing* the enabler class is unlikely to be useful. However, if you do, the `intercept` method is your most likely target of customization.

[bb-view-el]: https://backbonejs.org/#View-constructor

#### Link enabler instance

This section discusses instances of the class discussed above.

You will rarely need to interact with this instance. However, the following methods and events are potentially useful to know about:

- `instance.undelegateEvents()` can be called in order to temporarily disable the link interception magic.
- `instance.delegateEvents()` can be called in order to re-enable the link interception magic.
- `instance.remove()` can be called if you stop using the enabler definitively. Don't worry, this will not remove the DOM element on which the behavior was attached.
- You can observe the usual `route` and `route:name` events on `history` and your routers in order to be notified of intercepted links.

### Module `mixin`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/mixin.js)

This module provides the `mixin` function, an alternative to Underscore's [`_.extend`][_extend] or the builtin [`Object.assign`][object-assign]. Like those functions, it can be used to copy enumerable properties from one object to another, but unlike those functions, it also copies non-enumerable properties. This is likely exactly what you need if the source object has getters and setters, which are non-enumerable by default.

``` javascript
import { mixin } from '@uu-cdh/backbone-util';

var mySourceObject = {
    get example() {
        return 'hi';
    }
};

var assigned = Object.assign({}, mySourceObject);
// assigned.example === undefined

var mixed = mixin({}, mySourceObject);
// mixed.example === 'hi'
```

[_extend]: https://underscorejs.org/#extend
[object-assign]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

#### Function `mixin`

Default export of `@uu-cdh/backbone-util/src/mixin.js`, reexported by name from the package index.

Parameters:

- `target`, the object to which properties will be copied.
- Zero or more `source` arguments from which properties will be copied.

Return value: `target`

Side effects: going from left to right, all enumerable and non-enumerable *own* (meaning: non-inherited) properties of each `source` are copied to `target`. If more than one `source` has a property with the same name, the property from the last `source` wins, unless the first one was [non-configurable][defprop-noconfig], in which case `mixin` will likely throw a `TypeError`.

> Since `mixin` only copies own properties, it is technically not an alternative to `_.extend` but to `_.extendOwn` (which, not coincidentally, is also aliased as `_.assign`). In practice, however, properties are usually copied from plain objects, so the difference between `_extend` and `_.extendOwn` does not matter and programmers tend to pick the former for brevity, even though copying of inherited properties is not intended. Plain object do have inherited properties from `Object.prototype`, which are all non-enumerable. Hence, it is important that our `mixin` restricts itself to own properties.

[defprop-noconfig]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#description

### Module `state-model`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/state-model.js)

"Plain vanilla" `Backbone.Model` instances emit convenient `change:attributeName` events, which let you track changes in each individual attribute separately. However, sometimes it is useful to also distinguish whether the attribute is being set after previously being absent, changing between two different values, or being unset. The `state-model` module makes this possible. It also separates the leading and trailing edges of these changes; in other words, separate events are triggered for the old value (or addition) and the new value (or removal) of the attribute.

Why would you need such extremely fine-grained events? The applications are diverse and surprisingly common:

- Automatically attaching *and* detaching main page elements in response to route changes. One possible way to approach this use case is illustrated in the example code below.
- Responding to the different stages of a user's sign-in/sign-out process.
- Tracking the various editing stages of a form element (pristine, focused, editing, tainted, valid, invalid, etcetera).
- Tracking whether a server is reachable; you typically want to respond very differently to a server going *offline* than to a server returning *online*.
- Your imagination is the limit. 😊

> In case this reminds you of [finite-state machines][fsm]: there is, indeed, a strong overlap in functionality, hence the name "state model". This module was inspired by (and written by the same author as) [backbone-machina][bb-mach].

``` javascript
import { Model, Router, history } from 'backbone';
import { getStateMixin } from '@uu-cdh/backbone-util';
import { homeView, profileView, settingsView } from './your/own/code';

// Obtain the mixin.
var stateMixin = getStateMixin();
// Make a class using the mixin.
var State = Model.extend(stateMixin);
// Get an instance, initially empty. We will use this below.
var state = new State;

// Our router. We don't need methods, just names.
var router = new Router({
    '': 'home',
    'home': 'home',
    'profile': 'profile',
    'settings': 'settings'
});

// Now, we use events to declaratively list which main view
// *should* be on the page, depending on the route.
router.on({
    'route:home': () => state.set('mainView', homeView),
    'route:profile': () => state.set('mainView', profileView),
    'route:settings': () => state.set('mainView', settingsView),
});
history.on('notfound', () => state.unset('mainView'));

// Finally, we use the fine-grained state events to attach the
// new main view (if there is one) and detach the previous main
// view (if there is one). Note how we don't need any if-else
// decision trees and the events ensure consistency. Also, these
// two event bindings will be sufficient even if we have 100
// different routes and main views!
state.on({
    'exit:mainView': (s, view) => view.$el.detach(),
    'enter:mainView': (s, view) => view.$el.appendTo('main'),
});
```

[fsm]: https://en.wikipedia.org/wiki/Finite-state_machine
[bb-mach]: https://www.npmjs.com/package/backbone-machina

#### Function `getStateMixin`

**Default export** of `@uu-cdh/backbone-util/src/state-model.js`, **reexported by name** from the package index.

**Parameter:** `options`, an optional control value to customize the mixin. If not omitted, it can be a boolean or a (plain) object with any properties that you want to add to the mixin.

**Return value:** plain object with methods and possibly other properties, suitable as a mixin for a subclass of `Backbone.Model`. Mixin contents are described in the next section.

**Side effects:** none.

#### State model mixin

This is the return value of `getSTateMixin`, discussed above.

By default, the mixin has three methods:

- `preinitialize` is predefined to call `this.bindStateEvents()` (next method) and do nothing else. By including this predefined `preinitialize`, we ensure that the mixin's special events are automatically activated in the constructor. You can safely override this method, or remove it from the mixin by passing `false` to `getStateMixin`, as long as you make sure that `this.bindStateEvents()` is called somewhere in the `initialize`, `preinitialize` or `constructor` method.
- `bindStateEvents` ensures that the state model's special events will trigger during the lifetime of the model. For this reason, you must be careful not to override the method. If you pass `false` to `getStateMixin` or you override the `preinitialize` method, you must also make sure that `this.bindStateEvents()` is called at some point during the constructor. The special events are discussed in the next section.
- `broadcastStateEvents` is an internal event handler that runs during `change` events. It triggers the individual events discussed in the next section. You never need to call this method manually.

#### State model events

State models emit the same **"change"** and **"change:[attribute]"** events as regular models. In addition, they trigger four other types of attribute-specific events, depending on the exact nature of the change:

- **"add:[attribute]"** (model, newValue, options): When **attribute** becomes set to `newValue` while it was previously unset.
- **"exit:[attribute]"** (model, oldValue, options): When **attribute** is no longer set to `oldValue`, either because it changed value or because it is unset.
- **"enter:[attribute]"** (model, newValue, options): When **attribute** has become set to `newValue`, either due to a change in value or because it was previously unset.
- **"remove:[attribute]"** (model, oldValue, options): When **attribute** becomes unset while it previously had `oldValue`.

Note that every attribute change comes with **two** of the above events:

- **"add:[attribute]"**+**"enter:[attribute]"** if **attribute** changes from unset to set;
- **"exit:[attribute]"**+**"enter:[attribute]"** if **attribute** changes from one set value to another;
- **"exit:[attribute]"**+**"remove:[attribute]"** if **attribute** changes from set to unset.

If you are mostly interested in whether the attribute is set or not, you probably want to listen for the **"add:[attribute]"**/**"remove:[attribute]"** event pair. If every intermediate value matters to you as well, you will want to listen for the **"exit:[attribute]"**/**"enter:[attribute]"** event pair instead.

### Module `trailing-slash`

Suppose that you have a collection whose `.url` is `'/documents'`. When you `.create` a new model in this collection, Backbone will send a `POST` request to `/documents`. If we now suppose that the `.id` of our new model is `4`, Backbone will send a `PUT` request to `/documents/4` when we modify the model and `.save` it. This is the default way in which the `Model.url()` method computes URLs.

Some server side frameworks, such as Django, are very picky about whether a URL ends in a slash or not. Depending on how you configure your URLs, it might be conventional, or the way of least resistance, to include trailing slashes in these URLs. For example, this is the case with [Django REST Framework][drf]. In such scenarios, `Model.url()` is doing exactly the wrong thing by omitting trailing slashes.

This module provides an easy way to ensure that your model's `.url()` includes a trailing slash.

``` javascript
import { Model } from 'backbone';
import { modelSlashUrl } from '@uu-cdh/backbone-util';

var MyModel = Model.extend({
    // MyModel.prototype.url behaves exactly like Model.prototype.url,
    // except that it always includes a trailing slash.
    url: modelSlashUrl(Model.prototype.url),
});
```

#### Function `modelSlashUrl`

**Default export** of `@uu-cdh/backbone-util/src/trailing-slash.js`, **reexported by name** from the package index.

**Parameter:** `urlMethod`, an existing implementation for `Model.url` that is almost right, except for the trailing slash. Defaults to `Backbone.Model.prototype.url`.

**Return value:** a new function that behaves like `urlMethod`, except for including a trailing slash.

**Side effects:** none.

### Module `user-model`

It is all too common for web applications to have an authentication system where users have to register, sign in and sign out. This module provides a model mixin with ready to use methods and events for the most common situations.

> For TypeScript users, this module comes with a type declarations file. The types are documented further down below.

``` javascript

```

## Planned features



## Support

Please report security issues to cdh@uu.nl. For regular bugs, feature requests or any other feedback, please use our [issue tracker][issues].

[issues]: https://github.com/CentreForDigitalHumanities/backbone-util/issues

## Development

Please see the [CONTRIBUTING](CONTRIBUTING.md) for everything related to testing, pull requests, versioning, etcetera.

## License

Licensed under the terms of the three-clause BSD license. See [LICENSE](LICENSE).
