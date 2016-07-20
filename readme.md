[![❁](https://dfcreative.github.io/prama/logo.png "❁")](https://dfcreative.github.io/prama)

# prāṃa [![WIP](https://img.shields.io/badge/Work%20in%20progress--green.svg)](http://github.com/badges/stability-badges)

<em>Para</em>meters <em>ma</em>nager for applications or tests.

Define parameters which your component depends on and _prama_ will take care of settings panel, history of changes, saving/loading states, parameter types, themes etc. Essentially it is a wrapper for [settings-panel](https://github.com/dfcreative/settings-panel).

## Usage

[![npm install prama](https://nodei.co/npm/prama.png?mini=true)](https://npmjs.org/package/prama/)

```js
var createParams = require('prama');

var params = createParams(
	title: 'Login',
	popup: 'dropdown',
	position: 'top-right',
	fields: [
		{ label: 'Full name', type: 'text'},
		{ label: 'Email', type: 'email'},
		{ label: 'Sign In', type: 'button', input: () => {
				var querystring = params.toString();
				//...
			}
		}
	]
);
```

## API

const Prama = require('prama');
<details><summary>let prama = **new Prama({title, fields, ...})**</summary>

Create settings manager instance based off options:

<dl>
<dt>title: 'Settings'
<dd>Display menu title at the top of the panel. Can be omitted.

<dt>fields: []
<dd>List or object of fields for <a href="https://github.com/dfcreative/settings-panel">settings-panel</a>.</dd> Prama adds <code>save</code> and <code>order</code> additional field properties.

<dt>theme: null
<dd>Theme, one of <em>control</em>, <em>dragon</em>, <em>lucy</em>, <em>merka</em>, <em>typer</em> or false for default theme. Require theme as <code>theme: require('prama/theme/name')</code>. See <a href="https://github.com/dfcreative/prama/tree/master/theme">theme</a> folder.

<dt>container: document.body
<dd>Container element to place panel and settings button.

<dt>popup: 'dropdown'
<dd>Enable popup — can be a popup type string, popup options or boolean. See <a href="https://github.com/dfcreative/popoff">popoff</a> for popup options.

<dt>draggable: true
<dd>Make panel draggable — can be boolean or handle selector. Default handle is panel title.

<dt>button: true
<dd>Create settings menu button at the corner of the page.

<dt>history: false
<dd>Reflect settings state in url.

<dt>session: true
<dd>Save/load settings state between browser sessions, overridden by history.

<dt>storage: window.sessionStorage
<dd>Default storage for session.</dd>
</dl>
</details>
<details><summary>prama.**get(name)**</summary>

Get single field value by `name`. If name is omitted - the full state will be returned.

</details>
<details><summary>prama.**get()**</summary>

Return state - an object with values of all fields.

</details>
<details><summary>prama.**set(name, value|options)**</summary>

Set field value or update field options.

</details>
<details><summary>prama.**set(state)**</summary>

Update multiple field values or options. State can be an object or a list.

</details>
<details><summary>prama.**on('change', (name, value, state) => {})**</summary>

Hook up a callback for any field change. Callback recieves field `name`, new `value` and full `state` arguments.

</details>
<details><summary>prama.**toString()**</summary>

Get string representation of state. Basically, a querystring.

</details>
<details><summary>prama.**show()**</summary>

Show panel.

</details>
<details><summary>prama.**hide()**</summary>

Hide panel.

</details>

## See also

* [settings-panel](https://github.com/freeman-lab/settings-panel) — setting panel used by prama.
* [popoff](https://github.com/dfcreative/popoff) — any type of popup, modal, dropdown etc.
* [start-app](https://github.com/dfcreative/start-app) — demo page for components.
* [tst](https://github.com/dfcreative/tst) — minimalistic test runner.
* [dat.gui](https://github.com/dataarts/dat.gui) — other oldschool settings panel.

## Credits

Thanks to [freepik.com](http://www.freepik.com/free-vector/flower-mandala-ornaments_714316.htm#term=mandala&page=1&position=12) for astonishing illustration used for logo.