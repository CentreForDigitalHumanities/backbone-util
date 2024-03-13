import _ from 'underscore';

// Work around Lodash's breaking changes.
var restArguments = _.restArguments || _.rest;

// _.reduce iteratee for the mixinSingle function below.
function amendNonCtorProperty(target, descriptor, key) {
    if (key !== 'constructor') Object.defineProperty(target, key, descriptor);
    return target;
}

// _.reduce iteratee for the mixin function below.
function mixinSingle(target, source) {
    var props = Object.getOwnPropertyDescriptors(source);
    return _.reduce(props, amendNonCtorProperty, target);
}

// This function can be used to mix additional properties into a class
// prototype, like _.extend. The difference with _.extend is that it will also
// copy non-enumerable properties such as getters and setters.
//
// Not to be confused with _.mixin, which adds functions to the Underscore
// (Lodash) object!
export default restArguments(function mixin(target, sources) {
    return _.reduce(sources, mixinSingle, target);
});
