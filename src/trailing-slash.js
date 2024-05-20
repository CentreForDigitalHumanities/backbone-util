import { Model } from 'backbone';

/**
 * Given a pre-existing model `.url` method, create a wrapped version that
 * ensures it includes a trailing slash. This may be useful if you use a
 * framework on the server side that insists on trailing slashes, such as
 * Django.
 * @param {Backbone.Model#url} [urlMethod=Backbone.Model#url] Method to wrap.
 * @returns {modelSlashUrl~url} Wrapped method.
 * @see {@link https://backbonejs.org/#Model-url}
 */
export function modelSlashUrl(urlMethod) {
    urlMethod = urlMethod || Model.prototype.url;

    /**
     * Version of [`Backbone.Model#url`]{@link
     * https://backbonejs.org/#Model-url} that always includes a trailing slash.
     * @this {Backbone.Model}
     * $returns {string}
     * @override
     */
    return function url() {
        var rawUrl = urlMethod.call(this);
        if (rawUrl.slice(-1) === '/') return rawUrl;
        return rawUrl + '/';
    };
}
