[![❁](https://dfcreative.github.io/prama/logo.png "❁")](https://dfcreative.github.io/prama)

# prāṃa [![WIP](https://img.shields.io/badge/Work%20in%20progress--green.svg)](http://github.com/badges/stability-badges)

<em>Para</em>meters <em>ma</em>nager for applications or tests.

Define parameters which your component depends on and _prama_ will take care of settings form, history of changes, saving/loading states, parameter types etc.

Examples:

* **[plot-grid](https://dfcreative.github.io/plot-grid)**
* **[settings constructor](https://dfcreative.github.io/prama)**

## Usage

[![npm install prama](https://nodei.co/npm/prama.png?mini=true)](https://npmjs.org/package/prama/)

```js
var createParams = require('prama');

var params = createParams({
	name: {
		label: 'Full name',
		type: 'text'
	},
	email: {
		label: 'Email',
		type: 'email'
	},
	submit: {
		label: '',
		value: 'Sign Up',
		type: 'submit',
		change: () => {
			var querystring = params.toString();
		}
	}
});

//display settings form
prams.show();
```

## API

### new Prama(object|list, options?)

Create prama instance based off array or object with keys standing for param names and values for param options.

```js
const Prama = require('prama');

const params = new Prama(
{
	//container element to place settings form/button
	container: document.body,

	//list/cache of params
	fields: [
		{
			//identifier, used as a key every and a label.
			name: 'My Param',

			//checkbox, number, range, select, button, radio, or any default input type
			type: 'text',

			//starting/current value
			value: false,

			//short message to explain the meaning of the param
			help: false,

			//for select or radio types
			values: [] or {},

			//<input> attributes
			min: 0,
			max: 100,
			step: 1,
			title: this.label,

			//set hidden attribute for a field
			hidden: false,

			//ignore any user attempts to input value
			readonly: false,

			//place passed styles to param’s `style` property.
			style: {},

			//reflect param value in session/history
			save: false,

			//will be called on any input, change, click or interaction event
			change: (value) => {}

			//for custom param return custom html
			create: param => `Custom html`
		},
		...
	],

	//popup settings, see popoff package for available options
	popup: {
		type: 'modal',
		side: 'center',
		...
	},

	button: true,

	draggable: true,

	//reflect state in browser hash (to share link)
	history: false,

	//save/load params between sessions
	session: true
});

//Add/change single param or list of params
prama.set(name?, value|options?, onchange?);
prama.set(object|array);

//Get value of a single param with `name`, or object with all params.
prama.get(name?);

//Hook up a callback for any parameter change.
prama.on('change', (name, value, opts) => {});
```

## See also

* [start-app](https://github.com/dfcreative/start-app) — demo page for components.
* [popoff](https://github.com/dfcreative/popoff) — any type of popup, modal, dropdown etc.
* [control-panel](https://github.com/freeman-lab/control-panel) — alternative settings panel.
* [dat.gui](https://github.com/dataarts/dat.gui) — oldschool settings panel.
* [tst](https://github.com/dfcreative/tst) — minimalistic test runner.

## Credits

Thanks to [freepik.com](http://www.freepik.com/free-vector/flower-mandala-ornaments_714316.htm#term=mandala&page=1&position=12) for astonishing illustration used for logo.