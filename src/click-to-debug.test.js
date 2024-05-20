import assert from 'assert';
import sinon from 'sinon';

import _ from 'underscore';
import { View } from 'backbone';

import getProtoProps from './click-to-debug.js';

// Sinon's way of describing the object we expect out of getProtoProps.
var expectedProps = {
    constructor: sinon.match.func,
    logInfo: sinon.match.func,
};

// Two flavors of view classes that we want to support.
class ModernView extends View {}
var ClassicView = View.extend({});

// We are going to repeat our tests for `derive` below with both flavors of view
// classes, so it is useful to have them in a collection.
var bases = {
    modern: function() {
        class Derived extends ModernView {
            constructor(options) {
                super(options);
                this.enableAltClick();
            }
        }
        _.extend(Derived.prototype, getProtoProps());
        return {Base: ModernView, Derived: Derived};
    },
    classic: function() {
        return {
            Base: ClassicView,
            Derived: ClassicView.extend(_.extend({
                constructor: function(options) {
                    ClassicView.call(this, options);
                    this.enableAltClick();
                }
            }, getProtoProps())),
        };
    },
};

// Clicking on a view is peanuts with jQuery.
function plainClick(view) {
    view.$el.trigger('click');
}

// However, as far as I'm aware jQuery does not offer any way to trigger an
// alt-click, so we use the native API instead.
function altClick(view) {
    var event = new MouseEvent('click', {altKey: true});
    view.el.dispatchEvent(event);
}

describe('alt-click view debugging aid', function() {
    describe('getProtoProps', function() {
        it('returns an object with the correct shape', function() {
            var result = getProtoProps();
            sinon.assert.match(result, expectedProps);
            assert(_.size(result) === 2);
        });

        it('always returns a new object', function() {
            var count = 5, results = _.times(count, getProtoProps);
            assert(_.uniq(results).length === count);
        });

        it('cannot be easily tampered with', function() {
            var firstResult = getProtoProps();
            firstResult.banana = true;
            delete firstResult.constructor;
            firstResult.logInfo = 4;
            var secondResult = getProtoProps();
            sinon.assert.match(secondResult, expectedProps);
            assert('banana' in firstResult);
            assert(!('banana' in secondResult));
        });
    });

    describe('derivation', function() {
        beforeEach(function() {
            sinon.spy(console, 'log');
        });

        afterEach(function() {
            console.log.restore();
        });

        _.each(bases, function(derive, flavor) {
            describe(flavor + ' flavor', function() {
                var Base, Derived, instance;

                beforeEach(function() {
                    var hierarchy = derive(Base);
                    Base = hierarchy.Base;
                    Derived = hierarchy.Derived;
                    sinon.spy(Base.prototype, 'initialize');
                    sinon.spy(Derived.prototype, 'logInfo');
                });

                afterEach(function() {
                    Base.prototype.initialize.restore();
                });

                it('returns a constructor with correct heritage', function() {
                    var viewProto = View.prototype,
                        baseProto = Base.prototype,
                        derivProto = Derived.prototype;
                    assert(_.isFunction(Derived));
                    assert(viewProto.isPrototypeOf(derivProto));
                    assert(Object.getPrototypeOf(derivProto) === baseProto);
                    sinon.assert.match(derivProto, expectedProps);
                });

                it('returns a constructor that calls its parent', function() {
                    instance = new Derived;
                    assert(Base.prototype.initialize.calledOnce);
                });

                describe('when window.DEBUGGING is falsy', function() {
                    it('does not attach the event handler', function() {
                        instance = new Derived;
                        plainClick(instance);
                        altClick(instance);
                        assert(instance.logInfo.notCalled);
                        assert(console.log.notCalled);
                    });
                });

                describe('when window.DEBUGGING is truthy', function() {
                    beforeEach(function() {
                        window.DEBUGGING = true;
                        instance = new Derived;
                    });

                    afterEach(function() {
                        delete window.DEBUGGING;
                    });

                    it('does attach the event handler', function() {
                        plainClick(instance);
                        altClick(instance);
                        assert(instance.logInfo.calledTwice);
                    });

                    describe('the handler', function() {
                        it('is a no-op without the alt key pressed', function() {
                            plainClick(instance);
                            assert(console.log.notCalled);
                        });

                        it('logs stuff with the alt key pressed', function() {
                            altClick(instance);
                            assert(console.log.calledWith(instance));
                        });
                    });
                });
            });
        });
    });
});
