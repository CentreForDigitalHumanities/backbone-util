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

**Side effects:*** none

#### Alt-click view mixin

Plain object with two methods.

##### Method `enableAltClick`

**Parameters:*** none

**Return value:*** `this` (so you can chain other view methods)

**Side effect:*** registers `logInfo` (described next) as click event handler

This method should be called *exactly once* in the `initialize` method or `constructor` of the view with the mixin. Event handler registration operates outside of Backbone's standard `delegate`/`undelegate` mechanism. This has several consequences:

- You can safely define the `events` hash or method of a subview without interfering with the registration of the alt-click handler.
- The event handler stays active, even if you call `this.undelegateEvents()`.
- The event bubbles up and will also be captured by enveloping views that have the mixin enabled. For example, if you placed an `AnnotationView` inside a `PageView` inside a `DocumentView` and all those views derive from a common base that has the mixin enabled, alt-clicking on the inner `AnnotationView` will also log the contents of the `PageView` and the `DocumentView`. The innermost view is logged first.
- The event is not automatically unregistered when you call `.remove()`. You can address this by overriding the `remove` method and adding the line `this.$el.off('click')`.

##### Method `logInfo`

**Parameter:*** click event object with an `altKey` property

**Return value:*** none

**Side effect:*** logs the full contents of the view instance to the developer console.

This method purely exists as an event handler. There is no added value in calling it from your own code; if you want to trigger the behavior manually, simply call `console.log(this)`. We document the existence of this method only so that you can avoid having a method with the same name.

### Module `csrf`



#### Function `wrapWithCSRF`

Default export of `@uu-cdh/backbone-util/src/csrf.js`, reexported by name from the package index.

**Parameters:***

-

## Planned features



## Support

Please report security issues to cdh@uu.nl. For regular bugs, feature requests or any other feedback, please use our [issue tracker][issues].

[issues]: https://github.com/CentreForDigitalHumanities/backbone-util/issues

## Development

Please see the [CONTRIBUTING](CONTRIBUTING.md) for everything related to testing, pull requests, versioning, etcetera.

## License

Licensed under the terms of the three-clause BSD license. See [LICENSE](LICENSE).
