# @uu-cdh/backbone-util

Various utilities for Backbone applications.

[Rationale](#rationale) | [Quickstart](#quickstart) | [Compatibility](#compatibility) | [Reference](#reference) | [Planned](#planned-features) | [Support](#support) | [Development](CONTRIBUTING.md) | [BSD 3-Clause](LICENSE)

## Rationale

We built several applications with a [Backbone][backbone] client. While writing those clients, we found ourselves repeating small patterns that were not yet abstracted by Backbone itself. We factored out those patterns and bundled them in this package, so that you can reuse them in your own Backbone single-page applications (SPAs). All of these utilities are small, independent additions to what Backbone can already do:

- a [view mixin](doc/click-to-debug.md) that causes the view to `console.log` its entire contents when alt-clicked, for easier debugging of the live application;
- a [`Backbone.sync` wrapper](doc/csrf.md) that automatically inserts a CSRF token header when sending a modifying request to the same origin, which is useful if (for example) you use [Django REST Framework][drf] with session authentication on the server side;
- [`when` and `whenever` functions](doc/future-attribute.md) that let you postpone code until an attribute is present on a model;
- a [very general `mixin` function](doc/mixin.md) that also copies non-enumerable properties, such as getters and setters;
- a model mixin that [adds finer-grained state change events](doc/state-model.md), which makes it suitable (for example) to act as an intermediary between router events and the placement of main page views;
- a [`Backbone.Model.url()` wrapper](doc/trailing-slash.md) that ensures URLs end with a slash, which is useful for server frameworks (such as Django) that are picky about it;
- a model mixin that [adds specific methods for user models](doc/user-model.md) such as `login`, `logout` and `register`, with matching events.

These utilities are well tested and we believe most Backbone applications can use at least a few of them.

We provide prototype [mixins](doc/using-mixins.md), rather than full-blown constructors/classes, because this gives you the freedom to layer them on top of a custom base class. This also leaves the choice up to you whether you want to use classic `Backbone.*.extend()` syntax or the modern `class`/ `super` keywords. We even have some [tips](doc/using-mixins.md) in case you want to combine Backbone with TypeScript.

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

[import-map]: https://developer.mozilla.org/docs/Web/HTML/Element/script/type/importmap

## Compatibility

The code modules use modern `import`/`export` syntax. If your target environment does not support this, you will need to take the code through a conversion or bundling tool first. Otherwise, only syntax is used that has existed for a while, so no transpilation or polyfilling should be required.

## Reference

- [using mixins](doc/using-mixins.md)
- [click-to-debug](doc/click-to-debug.md)
- [csrf](doc/csrf.md)
- [future-attribute](doc/future-attribute.md)
- [mixin](doc/mixin.md)
- [state-model](doc/state-model.md)
- [trailing-slash](doc/trailing-slash.md)
- [user-model](doc/user-model.md)

## Planned features

- A tooltip view mixin and utility function, which takes care of correctly positioning tooltips relative to (a subelement of) another view.

## Support

Please report security issues to cdh@uu.nl. For regular bugs, feature requests or any other feedback, please use our [issue tracker][issues].

[issues]: https://github.com/CentreForDigitalHumanities/backbone-util/issues

## Development

Please see the [CONTRIBUTING](CONTRIBUTING.md) for everything related to testing, pull requests, versioning, etcetera.

## License

Licensed under the terms of the three-clause BSD license. See [LICENSE](LICENSE).
