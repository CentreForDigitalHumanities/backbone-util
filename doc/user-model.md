# `@uu-cdh/backbone-util/src/user-model.js`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/user-model.js)
[package README](../README.md)

It is all too common for web applications to have an authentication system where users have to register, sign in and sign out. This module provides a model mixin with ready to use methods and events for the most common situations.

> For TypeScript users, this module comes with a type declarations file. The types are documented further down below.

``` javascript
import { Model } from 'backbone';
import { getUserMixin, when } from '@uu-cdh/backbone-util';
import { loginForm, logoutButton } from './your/own/code';

// Create a user model class using the mixin.
var User = Model.extend(getUserMixin({
    loginUrl: '/auth/login',
    logoutUrl: '/auth/logout',
    registerUrl: '/auth/register',
    confirmRegistrationUrl: '/auth/confirm',
}));

// Create an instance.
var user = new User;

// Bind some events.
user.on({
    'login:success': user.fetch,
    'login:error': () => alert('oops, login failed!')
});
when(user, 'name', () => alert('welcome ' + name));
user.on('logout:success', () => alert('goodbye!'));

// Use some methods. loginForm and logoutButton are views.
loginForm.on('submit', view => user.login(view.model.attributes));
logoutButton.on('submit', () => user.logout());
```

## Function `getUserMixin`

**Default export** of `@uu-cdh/backbone-util/src/user-model.js`, **reexported by name** from the package index.

**Parameter:** `settings`, an object with additional properties to set on the mixin. Individual settings described below. Any other properties or methods that you pass with this argument will be set on the mixin as well.

**Return value:** model mixin with user-related methods and events, described in the next section.

**Side effects:** none.

### Setting `loginUrl`

String with the URL to which login requests should be sent. Required if you want to use the `login` method.

### Setting `logoutUrl`

String with the URL to which logout requests should be sent. Required if you want to use the `logout` method.

### Setting `registerUrl`

String with the URL to which registration requests should be sent. Required if you want to use the `register` method.

### Setting `confirmRegistrationUrl`

String with the URL to which registration confirmation requests should be sent. Required if you want to use the `confirmRegistration` method.

### Setting `permissionsAttribute`

String with the name of the attribute that will contain the user's set of permissions. Defaults to `'permissions'`. Value must be correct if you want to use the `hasPermission` method.

## User model mixin

This is the return value of `getUserMixin`, discussed above. Apart from any settings that you passed to `getUserMixin`, it has the following methods.

### Method `login`

**Parameter:** `credentials`, an object with any data that are required in order to authenticate the user. Usually, this will be something of the shape `{username: string, password: string}`.

**Return value:** promise-like object of the same type as returned by `this.save()`, usually a `jQuery.jqXHR`.

**Side effects:** sends a `POST` request to `this.loginUrl` with the `credentials` as a JSON payload. The `credentials` are not stored on the model, but any JSON data included in the response will be saved if the request is successful. Apart from the usual **"request"** and **"sync"**/**"error"**, the following events may be triggered:

- **"login:success"** (model, response): when authentication is successful.
- **"login:error"** (model, xhr): when authentication fails or the connection errors.

### Method `logout`

**Parameters:** none.

**Return value:** promise-like object of the same type as returned by `this.save()`, usually a `jQuery.jqXHR`.

**Side effects:** sends a `POST` request to `this.logoutUrl`. Calls `this.clear()` on success. Apart from the usual **"request"** and **"sync"**/**"error"**, the following events may be triggered:

- **"logout:success"** (model, response): when signout is successful.
- **"logout:error"** (model, xhr): when signout fails or the connection errors.

### Method `register`

**Parameter:** `details`, an object with any data that are required in order to register the user. For example `{username: string, password1: string, password2: string, email: string}`.

**Return value:** promise-like object of the same type as returned by `this.save()`, usually a `jQuery.jqXHR`.

**Side effects:** sends a `POST` request to `this.registerUrl` with the `details` as a JSON payload. The `details` are not stored on the model, but any JSON data included in the response will be saved if the request is successful. Apart from the usual **"request"** and **"sync"**/**"error"**, the following events may be triggered:

- **"registration:success"** (model, response): when registration is successful.
- **"registration:error"** (model, xhr): when registration fails or the connection errors.

### Method `confirmRegistration`

**Parameter:** `details`, an object with any data that are required in order to confirm registration. Usually, this will be something of the shape `{key: string}`.

**Return value:** promise-like object of the same type as returned by `this.save()`, usually a `jQuery.jqXHR`.

**Side effects:** sends a `POST` request to `this.confirmRegistrationUrl` with the `details` as a JSON payload. The `details` are not stored on the model, but any JSON data included in the response will be saved if the request is successful. Apart from the usual **"request"** and **"sync"**/**"error"**, the following events may be triggered:

- **"confirm-registration:success"** (model, response): when confirmation is successful.
- **"confirm-registration:error"** (model, xhr): when confirmation fails or the connection errors.

### Method `hasPermission`

**Parameter:** `permission`, a string or other value that identifies the permission that you want to check.

**Return value:** `true` if the user has `permission`, `false` otherwise.

**Side effects:** none.

The assumption of this method is that the fetched user model has an attribute with the name in `this.permissionsAttribute`. It should be an array of values of the same type as `permission`, which can be compared using the `===` operator.

``` javascript
import { Model } from 'backbone';
import { getUserMixin } from '@uu-cdh/backbone-util';

var UserModel = Model.extend(getUserMixin({
    permissionsAttribute: 'authorizedFor'
}));

var user = new User({
    // For the sake of illustration, we set the permissions attribute
    // directly. Normally, it would be set by the backend.
    authorizedFor: ['sliceCake', 'cleanWindow', 'writeDocument']
});

user.hasPermission('sliceCake'); // true
user.hasPermission('launchMissile'); // false
```

## TypeScript declarations for `user-model`

Since it is likely that you want to further customize your user model and its types are nontrivial, `@uu-cdh/backbone-util/src/user-model.js` comes with a companion `.d.ts` module to cater to TypeScript users. Please refer to [the source][user-model-dts] for details.

``` typescript
import { extend } from 'underscore';
import { Model } from 'backbone';
import {
    getUserMixin, StringDict, UserSettings, User
} from '@uu-cdh/backbone-util/src/user-model.js';

interface MyUser extends User {}
class MyUser extends Model {}
extend(MyUser.prototype, getUserMixin({
    loginUrl: '/auth/login',
    logoutUrl: '/auth/logout',
    registerUrl: '/auth/register',
    confirmRegistrationUrl: '/auth/confirm',
}));
```

[user-model-dts]: https://github.com/CentreForDigitalHumanities/backbone-util/blob/main/src/user-model.d.ts

### Type `StringDict`

This is the type of the parameter passed to the `login` and `register` methods. It is simply `{[key: string]: string}`.

### Type `UserSettings`

This is the base type of the parameter passed to `getUserMixin`. It is an object with four required string properties, `loginUrl`, `logoutUrl`, `registerUrl` and `confirmRegistrationUrl`, and one optional string property, `permissionsAttribute`.

### Type `User`

The base type of the mixin returned by `getUserMixin`. It extends `UserSettings` and includes the methods documented above.

### Type `getUserMixin`

The function signature takes into account that you may pass other properties than those specified in `UserSettings`. The return type includes all properties from the argument type as well as all properties from `User`.

``` typescript
function getUserMixin<T extends UserSettings>(settings: T) : User & T;
```
