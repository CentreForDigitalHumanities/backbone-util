import { Model } from 'backbone';

// Given a pre-existing model `.url` method, create a wrapped version that
// ensures it includes a trailing slash. This may be useful if you use a
// framework on the server side that insists on trailing slashes, such as
// Django.
export function modelSlashUrl(urlMethod) {
    urlMethod = urlMethod || Model.prototype.url;
    return function url() {
        var rawUrl = urlMethod.call(this);
        if (rawUrl.slice(-1) === '/') return rawUrl;
        return rawUrl + '/';
    };
}
