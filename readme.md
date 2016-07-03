[![❁](https://dfcreative.github.io/prama/logo.png "❁")](https://dfcreative.github.io/prama)

# prāṃa [![WIP](https://img.shields.io/badge/Work%20in%20progress--green.svg)](http://github.com/badges/stability-badges)

<em>Para</em>meters <em>ma</em>nager for applications or tests.

Define parameters which your component or application depends on and _prama_ will take care of settings menu, settings form, history of changes, saving/loading parameters, settings hierarchy, parameter types etc.

**[Demo](https://dfcreative.github.io/prama)**

## Usage

[![npm install prama](https://nodei.co/npm/prama.png?mini=true)](https://npmjs.org/package/prama/)

```js
var Params = require('prama');

var params = new Params({
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
			params.getParams();
		}
	}
});
```

## API

### Prama(object|list, options?)

Create prama instance based off array or object with keys standing for param names and options.

```js
var params = Prama([
	{
		//identifier, used as a key every here and there. Case-insensitive.
		name: 'my-param',

		//checkbox/toggle, number, range/multirange, select, button, radio/switch
		//any default input type: password, email, url, tel, time, date, week
		//undefined type will be guessed from other options
		type: 'text',

		//(optional) human-readable name of param
		label: '',

		//(optional) starting/current value
		value: false,

		//(optional) for select or switch types
		values: [] or {},

		//(optional) input attributes
		min: 0,
		max: 100,
		step: 1,
		title: this.label,

		//(optional) used to avoid over-serialization
		default: this.value,

		//(optional) order of placement
		order: 0,

		//(optional) whether page reload is required if param changed
		reload: false,

		//(optional) short message to explain the meaning of the param
		help: false,

		//(optional) whether we need to disable param, useful in case of dependent params
		disabled: false,

		//(optional) ignore any user attempts to input value
		readonly: false,

		//(optional) place passed styles to param’s `style` property.
		style: {},

		//(optional) will be called on any input or change event
		change: (value) => {}

		//(optional) for custom param return custom html
		create: () => {}
	},
	...
], {
	//track history of changes
	history: true,

	//load last state from localStorage
	load: true,

	//show button at the page exhibiting settings page
	ui: true
});

//Add/set `options` or `value` to `name` parameter. Pass optional `change` callback.
prama.setParam(name, value|options?, onchange?);

//Add/set params based off object or array of params.
prama.setParams(object|array);

//Get value of a single param with `name`.
prama.getParam(name);

//Get object with values of all params.
prama.getParams(whitelist?);

//Universal param getter/setter, including methods above
prama.param(object|array?);
prama.param(name?, value|options?, callback?);

//Hook up a callback for any parameter change.
prama.on('change', (name, value, opts) => {});


//Form element, use if `ui === false`
prama.element;
```

## See also

* [start-app](https://github.com/dfcreative/start-app) — demo page for components.
* [tst](https://github.com/dfcreative/tst) — minimalistic test runner.
* [popoff](https://github.com/dfcreative/popoff) — any type of popup, modal, dropdown etc.

## Credits

Thanks to [freepik.com](http://www.freepik.com/free-photos-vectors/flower) for astonishing illustration used for logo.