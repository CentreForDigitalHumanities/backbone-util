import assert from 'assert';
import sinon from 'sinon';

import _ from 'underscore';
import { View, history, History, $ } from 'backbone';

import makeLinkEnabler from './internal-links.js';

var testViewTemplate = _.constant(
    '<a class=nolink name=anchor><a/>\n' +
    '<a class=internal href="/route">click me<a/>\n' +
    '<a class=external href="//example.domain/route">pick me<a/>\n' +
    '<a class=http href="http://example.domain/route">visit me<a/>\n' +
    '<a class=https href="https://example.domain/route">join me<a/>\n' +
    '<map>\n' +
    '    <area class=nolink shape=default />\n' +
    '    <area class=internal href="/route"\n' +
    '        shape=circle coords="100,100,100" />\n' +
    '    <area class=external href="//example.domain/route"\n' +
    '        shape=circle coords="100,300,100" />\n' +
    '    <area class=http href="http://example.domain/route"\n' +
    '        shape=circle coords="300,100,100" />\n' +
    '    <area class=https href="https://example.domain/route"\n' +
    '        shape=circle coords="300,300,100" />\n' +
    '</map>\n'
);

var tagNames = ['a', 'area'];
var classNames = ['nolink', 'internal', 'external', 'http', 'https'];

var TestView = View.extend({
    template: testViewTemplate,
    render: function() {
        this.$el.html(this.template());
        return this;
    }
});

describe('internal link enabler', function() {
    var testView, LinkEnabler, enabler, eventWatcher;

    function registerClickEvent(event) {
        eventWatcher.defaultPrevented = event.isDefaultPrevented();
        event.preventDefault();
    }

    beforeEach(function() {
        testView = new TestView;
        testView.render().$el.appendTo(document.body);
    });

    afterEach(function() {
        testView.remove().off();
    });

    describe('by default', function() {
        beforeEach(function() {
            LinkEnabler = makeLinkEnabler();
            // We do not lose the "real" `navigate` because it is still on
            // `History.prototype`.
            history.navigate = sinon.fake();
        });

        afterEach(function() {
            // Back to the real `navigate` on `History.prototype`.
            delete history.navigate;
        });

        it('returns a class that derives from Backbone.view', function() {
            assert(LinkEnabler !== View);
            assert(LinkEnabler.prototype instanceof View);
        });

        describe('the instance', function() {
            beforeEach(function() {
                enabler = new LinkEnabler;
                // We are going to click on links to external URLs, so we need
                // to prevent those events from ruining the remainder of our
                // tests.
                eventWatcher = sinon.fake(registerClickEvent);
                $(document.body).on('click', eventWatcher);
            });

            afterEach(function() {
                $(document.body).off('click', eventWatcher);
                enabler.remove().off();
            });

            it('attaches itself to document.body', function() {
                assert(enabler.el === document.body);
            });

            _.each(tagNames, function(tagName) {
                _.each(classNames, function(className) {
                    var selector = tagName + '.' + className;
                    var tagHTML = ' <' + tagName + '> ';
                    var objectPhrase = tagHTML + 'clicks to ' + className;
                    if (className === 'internal') {
                        it('intercepts' + objectPhrase, function() {
                            testView.$(selector).click();
                            assert(eventWatcher.defaultPrevented);
                            assert(history.navigate.calledWith(
                                '/route',
                                sinon.match({trigger: true})
                            ));
                        });
                    } else {
                        it('does not intercept' + objectPhrase, function() {
                            testView.$(selector).trigger('click');
                            assert(!eventWatcher.defaultPrevented);
                            assert(history.navigate.notCalled);
                        });
                    }
                });
            });

            it('does not alter the DOM when removed', function() {
                assert($('body div map').length === 1);
                enabler.remove();
                assert($('body div map').length === 1);
            });
        });
    });

    describe('with overridden BaseView', function() {
        beforeEach(function() {
            LinkEnabler = makeLinkEnabler(TestView);
        });

        it('returns a class that derives from BaseView', function() {
            assert(LinkEnabler !== TestView);
            assert(LinkEnabler.prototype instanceof TestView);
        });
    });

    describe('with overridden history', function() {
        var altHistory;

        beforeEach(function() {
            history.stop();
            altHistory = new History;
            LinkEnabler = makeLinkEnabler(null, altHistory);
            // We do not lose the "real" `navigate` because it is still on
            // `History.prototype`.
            history.navigate = sinon.fake();
            altHistory.navigate = sinon.fake();
        });

        afterEach(function() {
            // Back to the real `navigate` on `History.prototype`.
            delete altHistory.navigate;
            delete history.navigate;
            history.start();
        });

        describe('the instance', function() {
            beforeEach(function() {
                enabler = new LinkEnabler;
                // We are going to click on links to external URLs, so we need
                // to prevent those events from ruining the remainder of our
                // tests.
                eventWatcher = sinon.fake(registerClickEvent);
                $(document.body).on('click', eventWatcher);
            });

            afterEach(function() {
                $(document.body).off('click', eventWatcher);
                enabler.remove().off();
            });

            it('navigates via the alternative history', function() {
                testView.$('a.internal').trigger('click');
                assert(eventWatcher.defaultPrevented);
                assert(history.navigate.notCalled);
                assert(altHistory.navigate.calledWith('/route'));
            });
        });
    });
});
