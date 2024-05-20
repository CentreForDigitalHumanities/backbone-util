# Using mixins

[package README](../README.md)

All of our mixins are supplied through a function. In some cases, this function enables you to customize the mixin. For example, the user model mixin requires that you supply some settings so that it knows where to send its requests:

``` javascript
import { getUserMixin } from '@uu-cdh/backbone-util';

var userMixin = getUserMixin({
    loginUrl: '/login',
    logoutUrl: '/logout',
    registerUrl: '/register',
    confirmRegistrationUrl: '/confirm'
});
```

Once you have created the mixin, using it with Backbone's trusty old class emulation is as simple as passing it as the first argument to the `extend` method:

``` javascript
import { Model } from 'backbone';

var MyUserModel = Model.extend(userMixin);
```

Alternatively, use modern `class` syntax and add the mixin to the prototype using Underscore's `_.extend`, `Object.assign` or our own [mixin](mixin.md):

``` javascript
import { extend } from 'underscore';

class MyUserModel extends Model {}
extend(MyUserModel.prototype, userMixin);
```

You can also take this approach with Backbone's classic `.extend`.

If you are using TypeScript, you may need [declaration merging][ts-mixin] and some additional type annotations:

``` typescript
import getUserMixin, { User } from '@uu-cdh/backbone-util/src/user-model.js';

interface MyUserModel extends User {}
class MyUserModel extends Model {}
extend(MyUserModel.prototype, userMixin);
```

[ts-mixin]: https://www.typescriptlang.org/docs/handbook/mixins.html
