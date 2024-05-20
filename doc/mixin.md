# `@uu-cdh/backbone-util/src/mixin.js`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/mixin.js)
[package README](../README.md)

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

## Function `mixin`

Default export of `@uu-cdh/backbone-util/src/mixin.js`, reexported by name from the package index.

Parameters:

- `target`, the object to which properties will be copied.
- Zero or more `source` arguments from which properties will be copied.

Return value: `target`

Side effects: going from left to right, all enumerable and non-enumerable *own* (meaning: non-inherited) properties of each `source` are copied to `target`. If more than one `source` has a property with the same name, the property from the last `source` wins, unless the first one was [non-configurable][defprop-noconfig], in which case `mixin` will likely throw a `TypeError`.

> Since `mixin` only copies own properties, it is technically not an alternative to `_.extend` but to `_.extendOwn` (which, not coincidentally, is also aliased as `_.assign`). In practice, however, properties are usually copied from plain objects, so the difference between `_extend` and `_.extendOwn` does not matter and programmers tend to pick the former for brevity, even though copying of inherited properties is not intended. Plain objects do have inherited properties from `Object.prototype`, which are all non-enumerable. Hence, it is important that our `mixin` restricts itself to own properties.

[defprop-noconfig]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#description
