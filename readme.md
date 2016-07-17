[![❁](https://dfcreative.github.io/prama/logo.png "❁")](https://dfcreative.github.io/prama)

# prāṃa [![WIP](https://img.shields.io/badge/Work%20in%20progress--green.svg)](http://github.com/badges/stability-badges)

<em>Para</em>meters <em>ma</em>nager for applications or tests.

Define parameters which your component depends on and _prama_ will take care of settings panel, history of changes, saving/loading states, parameter types etc. Essentially it is a wrapper for [control-panel](https://github.com/freeman-lab).

Examples:

* **[plot-grid](https://dfcreative.github.io/plot-grid)**
* **[settings constructor](https://dfcreative.github.io/prama)**

## Usage

[![npm install prama](https://nodei.co/npm/prama.png?mini=true)](https://npmjs.org/package/prama/)

```js
var createParams = require('prama');

var params = createParams(
	title: 'Login',
	fields: [
		{ label: 'Full name', type: 'text'},
		{ label: 'Email', type: 'email'},
		{ label: 'Sign Up', type: 'button', action: () => {
				var querystring = params.toString();
				login(querystring);
			}
		}
	],
	button: true,
	popup: 'dropdown'
);
```

## API

```js
const Prama = require('prama');

// create parameters manager instance based off options.
const params = new Prama({
	//menu title
	title: 'Settings',

	//list or cache of control-panel parameters
	fields: [] or {},

	//theme name or object for the control-panel
	theme: 'light' or {
		fontFamily: '"Hack", monospace',
		fontSize: '14px',
		background1: 'rgb(227,227,227)',
		background2: 'rgb(204,204,204)',
		background2hover: 'rgb(208,208,208)',
		foreground1: 'rgb(105,105,105)',
		text1: 'rgb(36,36,36)',
		text2: 'rgb(87,87,87)'
	},

	//placement of the button/panel
	position: 'top-right',

	//container element to place panel and button
	container: document.body,

	//settings for popup or `false` to avoid creating popup
	popup: {
		type: 'modal',
		side: 'center',
		//... see popoff package for available options
	},

	//make panel draggable
	draggable: true,

	//create settings menu button
	button: true,

	//svg to use for a menu icon
	icon: `./gears.svg`,

	//reflect state in url (for shareable states), including loading history
	history: false,

	//save/load params between sessions
	session: true,

	//default storage
	storage: window.sessionStorage,

	//storage key
	key: 'prama'
});

//Show/hide params menu
prama.show();
prama.hide();

//Hook up a callback for any parameter change.
prama.on('change', (name, value, opts) => {});

//Get string/object representation of state
prama.toString();
prama.toObject();
```

## See also

* [settings-panel](https://github.com/freeman-lab/settings-panel) — setting panel used by prama.
* [popoff](https://github.com/dfcreative/popoff) — any type of popup, modal, dropdown etc.
* [start-app](https://github.com/dfcreative/start-app) — demo page for components.
* [tst](https://github.com/dfcreative/tst) — minimalistic test runner.
* [dat.gui](https://github.com/dataarts/dat.gui) — other oldschool settings panel.

## Credits

Thanks to [freepik.com](http://www.freepik.com/free-vector/flower-mandala-ornaments_714316.htm#term=mandala&page=1&position=12) for astonishing illustration used for logo.