import { defaults, isFunction, isString, result } from 'underscore';
import Cookies from 'js-cookie';

// URLs starting with // or http: are not relative to the same host.
var nonRelative = /^(https?:)?\/\//;
// ... unless that is exactly what comes next.
var sameOrigin = RegExp(nonRelative.source + window.location.host + '($|/)');

// Expected types of the arguments to `wrapWithCSRF`.
var requirements = {
    sync: 'function with the same interface as Backbone.sync',
    header: 'nonempty string',
    cookie: 'nonempty string',
};

// Internal shorthand for the thing we do every time an argument has the wrong
// type.
function bail(key) {
    throw new TypeError(key + ' must be a ' + requirements[key]);
}

// Given `Backbone.sync` or a similar function, a header name such as
// 'X-CSRFToken' and a cookie name such as 'csrftoken', create a new variant of
// the `sync` function. See below for a description of the wrapped function.
export default function wrapWithCSRF(sync, header, cookie) {
    if (!isFunction(sync)) bail('sync');
    if (!header || !isString(header)) bail('header');
    if (!cookie || !isString(cookie)) bail('cookie');

    // A wrapper of `sync` that adds a CSRF token header under the following
    // conditions:
    // - the request is to the same origin;
    // - it is a modifying request (any method other than GET or HEAD).
    return function syncWithCSRF(method, model, options) {
        var opt = options || {};
        var url = opt.url || result(model, 'url');
        if (
            // We first check the options, because these will override whatever
            // `Backbone.sync` computes based on the standalone `method`
            // argument.
            opt.method === 'GET' ||
            opt.method === 'HEAD' ||
            // Otherwise, we know that `'read'` is the only nonmodifying CRUD
            // method in Backbone's book.
            !opt.method && method === 'read' ||
            // Without any URL, `Backbone.sync` will error.
            !url ||
            // We must not leak the CSRF cookie in requests to other hosts.
            nonRelative.test(url) && !sameOrigin.test(url)
        // In all of the above cases, we can/must save ourselves the effort of
        // adding the token header.
        ) return sync(method, model, options);
        // In all remaining cases, insert the header before forwarding the
        // arguments to the underlying `sync`. We make sure not to modify the
        // original `options` or `options.headers`.
        var headers = opt.headers || {}, extension = {};
        extension[header] = Cookies.get(cookie);
        opt = defaults({headers: defaults(extension, headers)}, opt);
        return sync(method, model, opt);
    };
}
