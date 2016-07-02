[![❁](https://dfcreative.github.io/prams/logo.svg "❁")](https://dfcreative.github.io/prams)

# prams [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Prams is settings constructor for applications or tests. Define parameters which your component depends on and _prams_ will take care of settings menu, settings form, history of changes, saving/loading parameters, settings hierarchy, parameter types etc. That is handy for testing and developing UI components.

See [example](https://dfcreative.github.io/prams).

## Usage

[![npm install prams](https://nodei.co/npm/prams.png?mini=true)](https://npmjs.org/package/prams/)

```js
var Params = require('prams');

var b = new Params([
	{
		name: 'log'
		label: 'Logarithmic View',
		type: 'checkbox',
		value: true
	},
	{

	}
], {
	history: true,
	load: true
});
```

## API

### Prams(params?, options?)

Create prams instance based off `params` set and `options`.
Params may be an array or object with keys standing for param names.

```js
var b = Prams({
	title: {

	},
	preview: {

	},
	description: {

	},
	color: {

		type: 'color'
	}
}, {
	saveState: true,

});
```

### prams.param(name, value|options, onchange?)

Add/set `options` or `value` to `name` parameter. Pass optional `change` callback.

### prams.param(set|list)

Add/set params based off object or array of params.

### prams.param(name?)

Get value of a single param. If name is not defined, the object consisting of all params values will be returned.

### prams.on('change', (name, value, opts) => {})

Hook up a callback for any parameter change.


## Options

### options.history

Track history of changed params.

### options.load

Autoload settings from the localStorage.


## Parameters

### param.name

Param identifier, esed as a key every here and there. Case-insensitive. May include dashes.

### param.type

Defines the type of param:

* checkbox
* range
* number
* text (default)
* select
* button
* multiselect WIP
* switch WIP
* color WIP
* date WIP
* area WIP
* output WIP
* canvas WIP
* any html input type

Undefined type will be guessed based on other options.

### param.label

Human-readable name of param. If undefined, title-cased `param.name` will be used as a label.

### param.help

Display help text to elaborate what is the meaning of the param. Can be displayed as a short message.

### param.value

Current param value.

### param.default

Default param value. If undefined - the initial `param.value` will be used.

### param.values

Set of possible values. Can be array with values or object with names as keys and values as... values. Used in `select` and `switch` param types. By default `null`.

### param.readonly

Set type to `output` and ignore any attemts to change the value. By default `false`.

### param.reload

Display notification that browser reload is required. Useful if some params significantly change the behavior of app, like switching _2d_ context to _webgl_ etc. By default `false`.

### param.order

Order of placement of the param. By default the order of passed list is used.

### param.include

Object with ids of other params dependent on the current param. Switching current param’s value to the defined value will display the dependent params.

```js
b.param({
	name: 'shape',
	values: ['square', 'circle', 'triangle']
	include: {
		square: ['length'],
		circle: ['radius']
	}
});
```

### param.style

Place passed styles to param’s `style` property.

### param.change

Passed function will be called each time param’s value changed.

### param.create

Define function to create custom param. The function should return element or string with html.

### param.*

Any other params will be placed to input tag attributes, like `min`, `max`, `step`, `placeholder`, `title`, etc.



## See also

* [start-app](https://github.com/dfcreative/start-app) — demo page for components.
* [tst](https://github.com/dfcreative/tst) — minimalistic test runner.
* [popoff](https://github.com/dfcreative/popoff) — any type of popup, modal, dropdown etc.

## Credits

Thanks to [freepik.com](<a href="http://www.freepik.com/free-photos-vectors/flower">Flower vector designed by Freepik</a>) for astonishing logo illustration.