import { isFunction } from 'underscore';
import fastTimeout from '@uu-cdh/timing-util/fastTimeout.js';

// Pattern for processing an `attribute` that may still be missing at the time
// of invocation. This is determined by testing whether `attribute` is present
// on `model`. `handler` is bound to `context` if passed, otherwise to `model`.
// `handler` is always invoked async, with the same arguments that the
// `change:$attribute` event would pass.
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

// Like `when`, with two main differences:
// 1. If the `attribute` is already present at the time of invocation, the
//    `handler` is invoked immediately instead of async.
// 2. The `handler` will continue to be invoked on every subsequent change of
//    the `attribute`, instead of being called exactly once.
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
