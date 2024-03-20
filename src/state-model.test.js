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

            it('triggers add: and enter: events for new attributes', function() {
                instance.on('add:document', eventWatcher1);
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

            it('triggers exit: and remove: for removed attributes', function() {
                instance.set('document', 2);
                instance.on({
                    'exit:document': eventWatcher1,
                    'remove:document': eventWatcher2
                });
                instance.unset('document');
                assert(eventWatcher1.calledWith(instance, 2));
                assert(eventWatcher2.calledWith(instance, 2));
                assert(eventWatcher1.calledBefore(eventWatcher2));
            });

            it('can handle complex mixtures of changes', function() {
                // We are going to use separate event listeners for all possible
                // combinations of event type and attribute name. There are four
                // event types and in this test, we track three attributes, so
                // twelve listeners in total.
                var watchers = [eventWatcher1, eventWatcher2]
                    .concat(_.times(10, function() { return sinon.fake(); }));
                var attributeNames = ['document', 'page', 'user'];
                var eventNames = ['add:', 'exit:', 'enter:', 'remove:'];
                // Attributes before we start listening for events.
                instance.set({document: 1, page: 10});
                // Backbone.Model supports recursive changes during model change
                // events, and so do we. We mimic this below by unsetting the
                // `page` attribute while the `document` attribute is being
                // updated. This also enables us to capture simultaneous `add:`
                // and `remove:` events in a single "burst" of changes.
                instance.once('change:document', instance.unset.bind(instance, 'page'));
                // Bind all of our event listeners.
                _.each(attributeNames, function(attr, i) {
                    _.each(eventNames, function(event, j) {
                        instance.on(event + attr, watchers[i * 4 + j]);
                    });
                });
                // Fire away!
                instance.set({document: 2, user: 'john'});
                assert(watchers[0].notCalled, 'add:document');
                assert(watchers[1].calledWith(instance, 1), 'exit:document');
                assert(watchers[2].calledWith(instance, 2), 'enter:document');
                assert(watchers[3].notCalled, 'remove:document');
                assert(watchers[4].notCalled, 'add:page');
                assert(watchers[5].calledWith(instance, 10), 'exit:page');
                assert(watchers[6].notCalled, 'enter:page');
                assert(watchers[7].calledWith(instance, 10), 'remove:page');
                assert(watchers[8].calledWith(instance, 'john'), 'add:user');
                assert(watchers[9].notCalled, 'exit:user');
                assert(watchers[10].calledWith(instance, 'john'), 'enter:user');
                assert(watchers[11].notCalled, 'remove:user');
                assert(watchers[1].calledBefore(watchers[2]), 'exit/enter document');
                assert(watchers[5].calledBefore(watchers[7]), 'exit/remove page');
                assert(watchers[8].calledBefore(watchers[10]), 'add/enter user');
            });
        });
    });

    describe('with false option', function() {
        beforeEach(function() {
            mixin = getStateMixin(false);
        });

        it('omits the preinitialize method', function() {
            sinon.assert.match(mixin, expectedInterface);
            assert(!('preinitialize' in mixin));
        });
    });

    describe('with object option', function() {
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
