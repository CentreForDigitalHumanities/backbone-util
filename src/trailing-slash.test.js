import assert from 'assert';
import sinon from 'sinon';

import _ from 'underscore';
import { Model, Collection } from 'backbone';

import { modelSlashUrl } from './trailing-slash.js';

describe('modelSlashUrl', function() {
    var model, collection;

    beforeEach(function() {
        model = new Model;
        collection = new Collection([model]);
        collection.url = '/documents';
    });

    it('returns a function', function() {
        assert(_.isFunction(modelSlashUrl()));
    });

    it('wraps Backbone.Model.prototype.url by default', function() {
        sinon.spy(Model.prototype, 'url');
        modelSlashUrl().call(model);
        assert(Model.prototype.url.calledOnce);
        Model.prototype.url.restore();
    });

    it('can wrap another function instead', function() {
        var internalUrl = sinon.fake.returns('');
        sinon.spy(Model.prototype, 'url');
        modelSlashUrl(internalUrl).call(model);
        assert(Model.prototype.url.notCalled);
        assert(internalUrl.calledOnce);
        Model.prototype.url.restore();
    });

    it('adds a trailing slash if the model .isNew', function() {
        assert(modelSlashUrl().call(model) === '/documents/');
    });

    it('avoids a duplicate trailing slash if .isNew', function() {
        collection.url = '/documents/';
        assert(modelSlashUrl().call(model) === '/documents/');
    });

    it('adds a trailing slash if the model not .isNew', function() {
        model.set('id', 1);
        assert(modelSlashUrl().call(model) === '/documents/1/');
    });

    it('avoids a duplicate trailing slash if not .isNew', function() {
        model.set('id', 1);
        collection.url = '/documents/';
        assert(modelSlashUrl().call(model) === '/documents/1/');
    });

    it('can handle the empty string', function() {
        assert(modelSlashUrl(_.constant('')).call(model) === '/');
    });

    it('can handle a single slash', function() {
        assert(modelSlashUrl(_.constant('/')).call(model) === '/');
    });

    it('can handle complete nonsense', function() {
        assert(modelSlashUrl(_.constant('///')).call(model) === '///');
    });
});
