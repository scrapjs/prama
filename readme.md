[![❁](https://dfcreative.github.io/prama/logo.png "❁")](https://dfcreative.github.io/prama)

# prāṃa [![WIP](https://img.shields.io/badge/Work%20in%20progress--green.svg)](http://github.com/badges/stability-badges)

<em>Para</em>meters <em>ma</em>nager for applications or tests.

Define parameters which your component or application depends on and _prama_ will take care of settings menu, settings form, history of changes, saving/loading states, settings hierarchy, parameter types etc.

**[Demo](https://dfcreative.github.io/prama)**

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
		change: function () => {
			var qs = params.toString();
		}
	}
});
```

## API

### new Prama(object|list, options?)

Create prama instance based off array or object with keys standing for param names and values for param options.

```js
const Prama = require('prama');

const params = new Prama([
	{
		//identifier, used as a key every here and there. Case-insensitive.
		name: 'my-param',

		//checkbox/toggle, number, range/multirange, select, button/submit, radio/switch
		//any default input type: password, email, url, tel, time, date, week
		//undefined type will be guessed from other options
		type: 'text',

		//(optional) human-readable name of param
		label: '',

		//(optional) starting/current value
		value: false,

		//(optional) for select or switch types
		values: [] or {},

		//(optional) <input> attributes
		min: 0,
		max: 100,
		step: 1,
		title: this.label,

		//(optional) short message to explain the meaning of the param
		help: false,

		//(optional) set hidden attribute for a field
		hidden: false,

		//(optional) ignore any user attempts to input value
		readonly: false,

		//(optional) reflect param in cache
		history: false,

		//(optional) save/restore param value from localStorage to keep smooth experience
		load: false,

		//(optional) place passed styles to param’s `style` property.
		style: {},

		//(optional) will be called on any input, change, click or interaction event
		change: (value) => {}

		//(optional) for custom param return custom html
		create: `Custom html` or (param) => `Custom html`
	},
	...
]);

//Add/set `options` or `value` to `name` parameter. Pass optional `change` callback.
prama.setParam(name, value|options?, onchange?);

//Get value of a single param with `name`.
prama.getParam(name);

//Add/set params based off object or array of params.
prama.setParams(object|array);

//Get object with values of all params.
prama.getParams(whitelist?);

//Hook up a callback for any parameter change.
prama.on('change', (name, value, opts) => {});

//Form element to insert to page
prama.element;
```

## See also

* [start-app](https://github.com/dfcreative/start-app) — demo page for components.
* [tst](https://github.com/dfcreative/tst) — minimalistic test runner.
* [popoff](https://github.com/dfcreative/popoff) — any type of popup, modal, dropdown etc.

## Credits

Thanks to [freepik.com](http://www.freepik.com/free-vector/flower-mandala-ornaments_714316.htm#term=mandala&page=1&position=12) for astonishing illustration used for logo.