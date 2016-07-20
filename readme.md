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

<details>
<summary>const Prama = require('prama');</summary>
Require Prama class instance.
</details>
<details>
<summary>const params = new Prama({</summary>
// create parameters manager instance based off options.
</details>
	//menu title
	title: 'Settings',

	//list or object of fields, see settings-panel for fields specification
	//prama adds `save` and `order` field properties
	fields: [
		{type: 'range', label: 'my range', min: 0, max: 100, value: 20},
		{type: 'range', label: 'log range', min: 0.1, max: 100, value: 20, scale: 'log'},
		{type: 'text', label: 'my text', value: 'my cool setting', help: 'why this is cool'},
		{type: 'checkbox', label: 'my checkbox', value: true},
		{type: 'color', label: 'my color', format: 'rgb', value: 'rgb(10,200,0)', change: value => console.log(value)},
		{type: 'button', label: 'gimme an alert', change: () => alert('hello!')},
		{type: 'select', label: 'select one', options: ['option 1', 'option 2'], value: 'option 1'}
		...
	],

	//theme, see theme folder
	theme: require('prama/theme/control'),

	//container element to place panel and button
	container: document.body,

	//popup - type string, options or true/false
	popup: 'dropdown',

	//make panel draggable - true, false or handle selector
	draggable: true,

	//create settings menu button
	button: true,

	//position of a button
	position: 'top-right',

	//svg to use for a menu icon
	icon: `./gears.svg`,

	//reflect state in url
	history: false,

	//save/load state between sessions, on load is overridden by history
	session: true,

	//default storage
	storage: window.sessionStorage
});

//Show/hide params menu
prama.show();
prama.hide();

//Hook up a callback for any parameter change.
prama.on('change', (name, value, opts) => {});

//Get string representation of state
prama.toString();

//Get/set state params
prama.get(name?) or prama.get();
prama.set(name?, value|options?) or prama.set(fields);
```

## See also

* [settings-panel](https://github.com/freeman-lab/settings-panel) — setting panel used by prama.
* [popoff](https://github.com/dfcreative/popoff) — any type of popup, modal, dropdown etc.
* [start-app](https://github.com/dfcreative/start-app) — demo page for components.
* [tst](https://github.com/dfcreative/tst) — minimalistic test runner.
* [dat.gui](https://github.com/dataarts/dat.gui) — other oldschool settings panel.

## Credits

Thanks to [freepik.com](http://www.freepik.com/free-vector/flower-mandala-ornaments_714316.htm#term=mandala&page=1&position=12) for astonishing illustration used for logo.