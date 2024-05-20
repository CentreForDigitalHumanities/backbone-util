import assert from 'assert';
import sinon from 'sinon';

import _ from 'underscore';
import { Model } from 'backbone';

import { when, whenever } from './future-attribute.js';

function callbackChecker(model, value, options, context, done) {
    return sinon.fake(function(m, v, o) {
        assert(m === model);
        assert(_.contains(value, v));
        assert.deepStrictEqual(o, options);
        assert(this === context);
        done();
    });
}

describe('when', function() {
    it('invokes the callback if the attribute is present', function(done) {
        var model = new Model({a: 1});
        var spy = callbackChecker(model, [1], {}, model, done);
        when(model, 'a', spy);
        assert(spy.notCalled);
    });

    it('invokes the callback when the attribute is first set otherwise', function(done) {
        var model = new Model();
        var spy = callbackChecker(model, [1], {}, model, done);
        when(model, 'a', spy);
        assert(spy.notCalled);
        model.set('a', 1);
    });

    it('respects the context', function(done) {
        var cb = _.after(2, done);
        var model = new Model({a: 1});
        var listener = new Model;
        var options = {silent: false};
        var spy1 = callbackChecker(model, [1], {}, listener, cb);
        var spy2 = callbackChecker(model, [2], options, listener, cb);
        when(model, 'a', spy1, listener);
        when(model, 'b', spy2, listener);
        model.set('b', 2, options);
    });

    it('accepts valid callbacks', function() {
        var model = new Model;
        when(model, 'a', (m) => null);
        when(model, 'b', (m, v) => null);
        when(model, 'c', (m, v, o) => null);
        model.off();
    });
});

describe('whenever', function() {
    it('invokes the callback if the attribute is present', function() {
        var model = new Model({a: 1});
        var spy = callbackChecker(model, [1, 2], {}, model, _.noop);
        whenever(model, 'a', spy);
        assert(spy.called);
        model.set('a', 2);
        assert(spy.calledTwice);
        model.off();
    });

    it('invokes the callback whenever the attribute is set otherwise', function() {
        var model = new Model();
        var spy = callbackChecker(model, [1, 2], {}, model, _.noop);
        whenever(model, 'a', spy);
        assert(spy.notCalled);
        model.set('a', 1);
        model.set('a', 2);
        assert(spy.calledTwice);
        model.off();
    });

    it('respects the context', function() {
        var model = new Model({a: 1});
        var listener = new Model;
        var options = {silent: false};
        var spy1 = callbackChecker(model, [1], {}, listener, _.noop);
        var spy2 = callbackChecker(model, [2], options, listener, _.noop);
        whenever(model, 'a', spy1, listener);
        whenever(model, 'b', spy2, listener);
        assert(spy1.called);
        assert(spy2.notCalled);
        model.set('b', 2, options);
        assert(spy2.called);
        listener.stopListening();
    });

    it('accepts valid callbacks', function() {
        var model = new Model;
        whenever(model, 'a', (m) => null);
        whenever(model, 'b', (m, v) => null);
        whenever(model, 'c', (m, v, o) => null);
        model.off();
    });
});
