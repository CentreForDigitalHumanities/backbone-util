# `@uu-cdh/backbone-util/src/csrf.js`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/csrf.js)
[package README](../README.md)

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

## Function `wrapWithCSRF`

**Default export** of `@uu-cdh/backbone-util/src/csrf.js`, **reexported by name** from the package index.

**Parameters:**

- `sync`, the implementation of [`Backbone.sync`][bb-sync] that you want to extend. The original `Backbone.sync` is automatically used as a fallback if you pass `null` or `undefined`.
- `header`, nonempty string with the name of the request header that should contain the CSRF token. There is no default value; consult the documentation of your backend framework on what it should be. In case of uncertainty, try `X-CSRFToken`.
- `cookie`, the name of the cookie that contains the CSRF token. There is no default value; consult the documentation of your backend framework on what it should be. In case of uncertainty, try `csrftoken`.

**Return value:** a new function with the same interface as `Backbone.sync`, described next

**Side effects:** none

## `sync`-like function with CSRF header insertion

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
