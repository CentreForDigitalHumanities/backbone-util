import { isFunction } from 'underscore';
import fastTimeout from '@uu-cdh/timing-util/fastTimeout.js';

/**
 * Process the given model attribute once, when it is set.
 * @param {Backbone.Model} model - Model on which we expect the attribute.
 * @param {string} attribute - Name of the expected attribute.
 * @param {AttributeChangeHandler} handler - Callback that should run when the
   attribute is set. Always runs async.
 * @param {*} [context=model] - `this` binding for the callback.
 */
export function when(model, attribute, handler, context) {
    var eventName = 'change:' + attribute;
    if (model.has(attribute)) {
        var value = model.get(attribute);
        fastTimeout(handler.bind(context || model), model, value, {});
    } else if (context && isFunction(context.listenToOnce)) {
        context.listenToOnce(model, eventName, handler);
    } else {
        model.once(eventName, handler, context);
    }
}

/**
 * Process the given model attribute immediately if set, as well as after every
   change.
 * @param {Backbone.Model} model - Model on which we expect the attribute.
 * @param {string} attribute - Name of the expected attribute.
 * @param {AttributeChangeHandler} handler - Callback that should run when the
   attribute is set and after every subsequent change.
 * @param {*} [context=model] - `this` binding for the callback.
 */
export function whenever(model, attribute, handler, context) {
    if (model.has(attribute)) {
        handler.call(context || model, model, model.get(attribute), {});
    }
    var eventName = 'change:' + attribute;
    if (context && isFunction(context.listenTo)) {
        context.listenTo(model, eventName, handler);
    } else {
        model.on(eventName, handler, context);
    }
}

/**
 * Function type used as the handler for `Backbone.Model`'s
   `'change:[attribute]'` event.
 * @callback AttributeChangeHandler
 * @param {Backbone.Model} model - Model of which the attribute changed.
 * @param {*} value - New value of the changed attribute.
 * @param {Object} options - Any options passed in the chain of function calls
   that led to the change.
 * @see {@link https://backbonejs.org/#Events-catalog}
 */
