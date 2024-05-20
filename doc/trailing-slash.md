# `@uu-cdh/backbone-util/src/trailing-slash.js`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/trailing-slash.js)
[package README](../README.md)

Suppose that you have a collection whose `.url` is `'/documents'`. When you `.create` a new model in this collection, Backbone will send a `POST` request to `/documents`. If we now suppose that the `.id` of our new model is `4`, Backbone will send a `PUT` request to `/documents/4` when we modify the model and `.save` it. This is the default way in which the `Model.url()` method computes URLs.

Some server side frameworks, such as Django, are very picky about whether a URL ends in a slash or not. Depending on how you configure your URLs, it might be conventional, or the way of least resistance, to include trailing slashes in these URLs. For example, this is the case with [Django REST Framework][drf]. In such scenarios, `Model.url()` is doing exactly the wrong thing by omitting trailing slashes.

This module provides an easy way to ensure that your model's `.url()` includes a trailing slash.

``` javascript
import { Model } from 'backbone';
import { modelSlashUrl } from '@uu-cdh/backbone-util';

var MyModel = Model.extend({
    // MyModel.prototype.url behaves exactly like Model.prototype.url,
    // except that it always includes a trailing slash.
    url: modelSlashUrl(),
});
```

[drf]: https://www.django-rest-framework.org/

## Function `modelSlashUrl`

**Default export** of `@uu-cdh/backbone-util/src/trailing-slash.js`, **reexported by name** from the package index.

**Parameter:** `urlMethod`, an existing implementation for `Model.url` that is almost right, except for the trailing slash. Defaults to `Backbone.Model.prototype.url`.

**Return value:** a new function that behaves like `urlMethod`, except for including a trailing slash.

**Side effects:** none.
