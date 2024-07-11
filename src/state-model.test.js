import assert from 'assert';
import sinon from 'sinon';

import _ from 'underscore';
import { Model } from 'backbone';

import getStateMixin from './state-model.js';

// Methods that we expect the mixin *always* to have, regardless of
// customizations.
var expectedInterface = {
    bindStateEvents: sinon.match.func,
    broadcastStateEvents: sinon.match.func
};

describe('getStateMixin', function() {
    var mixin, State;

    describe('by default', function() {
        beforeEach(function() {
            mixin = getStateMixin();
            State = Model.extend(mixin);
        });

        it('returns a mixin with three properties', function() {
            sinon.assert.match(mixin, expectedInterface);
            sinon.assert.match(mixin.preinitialize, sinon.match.func);
        });

        describe('mixin.bindStateEvents', function() {
            it('binds the event handler', function() {
                mixin.on = sinon.fake();
                mixin.bindStateEvents();
                assert(mixin.on.calledWith('change', mixin.broadcastStateEvents));
            });
        });

        describe('mixin.preinitialize', function() {
            it('calls bindStateEvents', function() {
                mixin.on = sinon.fake();
                sinon.spy(mixin, 'bindStateEvents');
                mixin.preinitialize();
                assert(mixin.bindStateEvents.calledOnce);
                mixin.bindStateEvents.restore();
            });
        });

        describe('the instance', function() {
            var instance, eventWatcher1, eventWatcher2;

            beforeEach(function() {
                instance = new State;
                eventWatcher1 = sinon.fake();
                eventWatcher2 = sinon.fake();
            });

            afterEach(function() {
                instance.off().stopListening();
            });

            it('triggers set: and enter: events for new attributes', function() {
                instance.on('set:document', eventWatcher1);
                instance.on('enter:document', eventWatcher2);
                instance.set('document', 1);
                assert(eventWatcher1.calledWith(instance, 1));
                assert(eventWatcher2.calledWith(instance, 1));
                assert(eventWatcher1.calledBefore(eventWatcher2));
            });

            it('triggers exit: and enter: events for changed values', function() {
                instance.set('document', 1);
                instance.on({
                    'exit:document': eventWatcher1,
                    'enter:document': eventWatcher2
                });
                instance.set('document', 2);
                assert(eventWatcher1.calledWith(instance, 1));
                assert(eventWatcher2.calledWith(instance, 2));
                assert(eventWatcher1.calledBefore(eventWatcher2));
            });

            it('triggers exit: and unset: for removed attributes', function() {
                instance.set('document', 2);
                instance.on({
                    'exit:document': eventWatcher1,
                    'unset:document': eventWatcher2
                });
                instance.unset('document');
                assert(eventWatcher1.calledWith(instance, 2));
                assert(eventWatcher2.calledWith(instance, 2));
                assert(eventWatcher1.calledBefore(eventWatcher2));
            });

            it('can handle complex mixtures of changes', function() {
                // We are going to use separate event listeners for all possible
                // combinations of event type and attribute name. Each listener
                // is a property in the following object, with the same name as
                // the `event:attribute`.
                var watchers = {};
                var attributeNames = ['document', 'page', 'user'];
                var eventNames = ['set:', 'exit:', 'enter:', 'unset:'];
                // Attributes before we start listening for events.
                instance.set({document: 1, page: 10});
                // Backbone.Model supports recursive changes during model change
                // events, and so do we. We mimic this below by unsetting the
                // `page` attribute while the `document` attribute is being
                // updated. This also enables us to capture simultaneous `set:`
                // and `unset:` events in a single "burst" of changes.
                instance.once('change:document', instance.unset.bind(instance, 'page'));
                // Bind all of our event listeners.
                _.each(attributeNames, function(attr) {
                    _.each(eventNames, function(event) {
                        var name = event + attr;
                        var watcher = watchers[name] = sinon.fake();
                        instance.on(name, watcher);
                    });
                });
                // Fire away!
                instance.set({document: 2, user: 'john'});
                assert(watchers['set:document'].notCalled);
                assert(watchers['exit:document'].calledWith(instance, 1));
                assert(watchers['enter:document'].calledWith(instance, 2));
                assert(watchers['unset:document'].notCalled);
                assert(watchers['set:page'].notCalled);
                assert(watchers['exit:page'].calledWith(instance, 10));
                assert(watchers['enter:page'].notCalled);
                assert(watchers['unset:page'].calledWith(instance, 10));
                assert(watchers['set:user'].calledWith(instance, 'john'));
                assert(watchers['exit:user'].notCalled);
                assert(watchers['enter:user'].calledWith(instance, 'john'));
                assert(watchers['unset:user'].notCalled);
                assert(watchers['exit:document'].calledBefore(watchers['enter:document']));
                assert(watchers['exit:page'].calledBefore(watchers['unset:page']));
                assert(watchers['set:user'].calledBefore(watchers['enter:user']));
            });

            it('does not cause infinite loops', function() {
                instance.set('counter', 0);
                instance.on('enter:extra', function() {
                    instance.set('counter', instance.get('counter') + 1);
                });
                instance.set('extra', 'abc');
                // In the above lines of code, the `extra` attribute never
                // changes. Hence, no feedback loop should be possible. However,
                // in early versions, this is exactly what happened. How?
                // Because of nested calls to `Backbone.Model#set`. The
                // outermost call changes the `extra` attribute, so it remains
                // in the model's `.changed` property during subsequent
                // iterations of the loops that issues the `change` event. New
                // iterations keep being added because the `counter` attribute
                // does change.
                assert(instance.get('counter') === 1);
            });
        });
    });

    describe('with preinitialize: false option', function() {
        beforeEach(function() {
            mixin = getStateMixin({
                preinitialize: false,
                banana: 'green',
            });
        });

        it('omits the preinitialize method', function() {
            sinon.assert.match(mixin, expectedInterface);
            assert(!('preinitialize' in mixin));
            assert(mixin.banana === 'green');
        });
    });

    describe('with other object options', function() {
        var overrides = {
            preinitialize: sinon.fake(),
            banana: 'brown'
        };

        beforeEach(function() {
            mixin = getStateMixin(overrides);
        });

        it('adds the options as overrides', function() {
            sinon.assert.match(mixin, expectedInterface);
            sinon.assert.match(mixin, overrides);
        });
    });
});
