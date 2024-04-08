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

/**
 * Mix additional properties into a class prototype or other object. Similar to
 * `_.extendOwn`, but will also copy non-enumerable properties such as getters
 * and setters.
 *
 * Not to be confused with `_.mixin`, which adds functions to the Underscore
 * (Lodash) object!
 *
 * @function mixin
 * @param {Object} target - Object to which properties will be copied.
 * @param {...Object} source - Object from which properties will be copied.
 * @returns target
 */
export default restArguments(function mixin(target, sources) {
    return _.reduce(sources, mixinSingle, target);
});
