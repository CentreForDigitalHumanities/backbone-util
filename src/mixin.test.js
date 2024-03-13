import assert from 'assert';

import mixin from './mixin.js';

class Base {
    constructor(arg) {
        this.foo = arg;
    }
    bar() {
        return 'bar';
    }
    get baz() {
        return this.foo;
    }
    set baz(arg) {
        this.foo = arg;
    }
}

class Mixin {
    foobar() {
        return 'foobar';
    }
    get foobaz() {
        return this.foofoo;
    }
    set foobaz(arg) {
        this.foofoo = arg;
    }
}

class Derived extends Base {
    constructor(arg) {
        super(arg);
        this.foofoo = arg;
    }
}
mixin(Derived.prototype, Mixin.prototype, { foobarbaz: 'foobarbaz' });

describe('mixin', function() {
    var obj;

    beforeEach(function() {
        obj = new Derived('beans');
    });

    it('respects class inheritance', function() {
        assert(obj.foo === 'beans');
        assert(obj.bar() === 'bar');
        assert(obj.baz === 'beans');
        obj.baz = 'lentils';
        assert(obj.foo === 'lentils');
        assert(obj.baz === 'lentils');
    });

    it('does not overwrite the constructor', function() {
        assert(Mixin.prototype.constructor === Mixin);
        assert(Derived.prototype.constructor === Derived);
        assert(Derived !== Mixin);
        assert(obj.foofoo === 'beans');
    });

    it('works', function() {
        assert(obj.foobar() === 'foobar');
        assert(obj.foobaz === 'beans');
        obj.foobaz = 'lentils';
        assert(obj.foofoo === 'lentils');
        assert(obj.foobaz === 'lentils');
        assert(obj.foobarbaz === 'foobarbaz');
    });
});
