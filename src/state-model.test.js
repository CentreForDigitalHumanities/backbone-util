import assert from 'assert';
import sinon from 'sinon';

import _ from 'underscore';
import { Model } from 'backbone';

import getStateMixin from './state-model.js';

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
                var watchers = [eventWatcher1, eventWatcher2]
                    .concat(_.times(10, function() { return sinon.fake(); }));
                var attributeNames = ['document', 'page', 'user'];
                var eventNames = ['add:', 'exit:', 'enter:', 'remove:'];
                instance.set({document: 1, page: 10});
                instance.once('change:document', instance.unset.bind(instance, 'page'));
                _.each(attributeNames, function(attr, i) {
                    _.each(eventNames, function(event, j) {
                        instance.on(event + attr, watchers[i * 4 + j]);
                    });
                });
                instance.set({document: 2, user: 'john'});
                assert(watchers[0].notCalled);
                assert(watchers[1].calledWith(instance, 1));
                assert(watchers[2].calledWith(instance, 2));
                assert(watchers[3].notCalled);
                assert(watchers[4].notCalled);
                assert(watchers[5].calledWith(instance, 10));
                assert(watchers[6].notCalled);
                assert(watchers[7].calledWith(instance, 10));
                assert(watchers[8].calledWith(instance, 'john'));
                assert(watchers[9].notCalled);
                assert(watchers[10].calledWith(instance, 'john'));
                assert(watchers[11].notCalled);
                assert(watchers[1].calledBefore(watchers[2]));
                assert(watchers[5].calledBefore(watchers[7]));
                assert(watchers[8].calledBefore(watchers[10]));
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
