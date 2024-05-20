import assert from 'assert';

import mixin from './mixin.js';

class Muppet {
    constructor(arg) {
        this.hobby = arg;
    }
    skin() {
        return 'fluffy';
    }
    get pastime() {
        return this.hobby;
    }
    set pastime(arg) {
        this.hobby = arg;
    }
}

// We will be using Gourmet.prototype as a mixin below.
class Gourmet {
    appetite() {
        return 'hungry';
    }
    get favoriteFood() {
        return this.favorite;
    }
    set favoriteFood(arg) {
        this.favorite = arg;
    }
}

class CookieMonster extends Muppet {
    constructor(arg) {
        super(arg);
        this.favorite = arg;
    }
}
mixin(CookieMonster.prototype, Gourmet.prototype, { motto: 'Chewabanga!' });

describe('mixin', function() {
    var obj;

    beforeEach(function() {
        obj = new CookieMonster('cookies');
    });

    it('respects class inheritance', function() {
        assert(obj.hobby === 'cookies');
        assert(obj.skin() === 'fluffy');
        assert(obj.pastime === 'cookies');
        obj.pastime = 'more cookies!';
        assert(obj.hobby === 'more cookies!');
        assert(obj.pastime === 'more cookies!');
    });

    it('does not overwrite the constructor', function() {
        assert(Gourmet.prototype.constructor === Gourmet);
        assert(CookieMonster.prototype.constructor === CookieMonster);
        assert(CookieMonster !== Gourmet);
        assert(obj.favorite === 'cookies');
    });

    it('works', function() {
        assert(obj.appetite() === 'hungry');
        assert(obj.favoriteFood === 'cookies');
        obj.favoriteFood = 'more cookies!';
        assert(obj.favorite === 'more cookies!');
        assert(obj.favoriteFood === 'more cookies!');
        assert(obj.motto === 'Chewabanga!');
    });
});
