# `@uu-cdh/backbone-util/src/state-model.js`

[view source](https://github.com/CentreForDigitalHumanities/backbone-util/tree/main/src/state-model.js)
[package README](../README.md)

"Plain vanilla" `Backbone.Model` instances emit convenient `change:attributeName` events, which let you track changes in each individual attribute separately. However, sometimes it is useful to also distinguish whether the attribute is being set after previously being absent, changing between two different values, or being unset. The `state-model` module makes this possible. It also separates the leading and trailing edges of these changes; in other words, separate events are triggered for the old value (or addition) and the new value (or removal) of the attribute.

Why would you need such extremely fine-grained events? The applications are diverse and surprisingly common:

- Automatically attaching *and* detaching main page elements in response to route changes. One possible way to approach this use case is illustrated in the example code below.
- Responding to the different stages of a user's sign-in/sign-out process.
- Tracking the various editing stages of a form element (pristine, focused, editing, tainted, valid, invalid, etcetera).
- Tracking whether a server is reachable; you typically want to respond very differently to a server going *offline* than to a server returning *online*.
- Your imagination is the limit. 😊

> In case this reminds you of [finite-state machines][fsm]: there is, indeed, a strong overlap in functionality, hence the name "state model". This module was inspired by (and written by the same author as) [backbone-machina][bb-mach].

The following example code illustrates how a state model could be used to mediate between route changes and the placement of main page elements.

``` javascript
import { Model, Router, history } from 'backbone';
import { getStateMixin } from '@uu-cdh/backbone-util';
import { homeView, profileView, settingsView } from './your/own/code';

// Obtain the mixin.
var stateMixin = getStateMixin();
// Make a class using the mixin.
var State = Model.extend(stateMixin);
// Get an instance, initially empty. We will use this below.
var state = new State;

// Our router. We don't need methods, just names.
var router = new Router({
    '': 'home',
    'home': 'home',
    'profile': 'profile',
    'settings': 'settings'
});

// Now, we use events to declaratively list which main view
// *should* be on the page, depending on the route.
router.on({
    'route:home': () => state.set('mainView', homeView),
    'route:profile': () => state.set('mainView', profileView),
    'route:settings': () => state.set('mainView', settingsView),
});
history.on('notfound', () => state.unset('mainView'));

// Finally, we use the fine-grained state events to attach the
// new main view (if there is one) and detach the previous main
// view (if there is one). Note how we don't need any if-else
// decision trees and the events ensure consistency. Also, these
// two event bindings will be sufficient even if we have 100
// different routes and main views!
state.on({
    'exit:mainView': (s, view) => view.$el.detach(),
    'enter:mainView': (s, view) => view.$el.appendTo('main'),
});
```

[fsm]: https://en.wikipedia.org/wiki/Finite-state_machine
[bb-mach]: https://www.npmjs.com/package/backbone-machina

## Function `getStateMixin`

**Default export** of `@uu-cdh/backbone-util/src/state-model.js`, **reexported by name** from the package index.

**Parameter:** `options`, a (plain) object with any properties that you want to add to the mixin. As a special case, you can set `preinitialize: false`, which causes the `preinitialize` method to be omitted entirely.

**Return value:** plain object with methods and possibly other properties, suitable as a mixin for a subclass of `Backbone.Model`. Mixin contents are described in the next section.

**Side effects:** none.

## State model mixin

This is the return value of `getStateMixin`, discussed above.

By default, the mixin has three methods, listed below. You do not need to call these methods from your own code, unless you omit or override `preinitialize`. In that case, you need to make a single call to `this.bindStateEvents()` in your own definition of `preinitialize`, `initialize` or `constructor`.

- `preinitialize` is predefined to call `this.bindStateEvents()` (next method) and do nothing else. By including this predefined `preinitialize`, we ensure that the mixin's special events are automatically activated in the constructor.
- `bindStateEvents` ensures that the state model's special events will trigger during the lifetime of the model. For this reason, you must be careful not to override the method. The special events are discussed in the next section.
- `broadcastStateEvents` is an internal event handler that runs during `change` events. It triggers the individual events discussed in the next section.

## State model events

State models emit the same **"change"** and **"change:[attribute]"** events as regular models. In addition, they trigger four other types of attribute-specific events, depending on the exact nature of the change:

- **"set:[attribute]"** (model, newValue, options): When **attribute** becomes set to `newValue` while it was previously unset.
- **"exit:[attribute]"** (model, oldValue, options): When **attribute** is no longer set to `oldValue`, either because it changed value or because it is unset.
- **"enter:[attribute]"** (model, newValue, options): When **attribute** has become set to `newValue`, either due to a change in value or because it was previously unset.
- **"unset:[attribute]"** (model, oldValue, options): When **attribute** becomes unset while it previously had `oldValue`.

Note that every attribute change comes with **two** of the above events:

- **"set:[attribute]"**+**"enter:[attribute]"** if **attribute** changes from unset to set;
- **"exit:[attribute]"**+**"enter:[attribute]"** if **attribute** changes from one set value to another;
- **"exit:[attribute]"**+**"unset:[attribute]"** if **attribute** changes from set to unset.

If you are mostly interested in whether the attribute is set or not, you probably want to listen for the **"set:[attribute]"**/**"unset:[attribute]"** event pair. If every intermediate value matters to you as well, you will want to listen for the **"exit:[attribute]"**/**"enter:[attribute]"** event pair instead.
