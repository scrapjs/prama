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

<details><summary>const params = new Prama(options);</summary>
Create parameters manager instance based off options.
#### Options
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;title: 'Settings',</summary>
Display menu title at the top. Can be omitted.
</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;fields: [],</summary>
List or object of fields, see [settings-panel](https://github.com/dfcreative/settings-panel) for fields specification.
Prama adds `save` and `order` additional field properties. Example:
```js
		{type: 'range', label: 'my range', min: 0, max: 100, value: 20},
		{type: 'range', label: 'log range', min: 0.1, max: 100, value: 20, scale: 'log'},
		{type: 'text', label: 'my text', value: 'my cool setting', help: 'why this is cool'},
		{type: 'checkbox', label: 'my checkbox', value: true},
		{type: 'color', label: 'my color', format: 'rgb', value: 'rgb(10,200,0)', change: value => console.log(value)},
		{type: 'button', label: 'gimme an alert', change: () => alert('hello!')},
		{type: 'select', label: 'select one', options: ['option 1', 'option 2'], value: 'option 1'}
		...
```
</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;theme: require('prama/theme/control'),</summary>
Theme, see theme folder</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;container: document.body,</summary>
Container element to place panel and button</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;popup: 'dropdown',</summary>
Popup - type string, options or true/false</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;draggable: true,</summary>
Make panel draggable - true, false or handle selector</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;button: true,</summary>
Create settings menu button</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;position: 'top-right',</summary>
Position of a button</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;icon: ./gears.svg,</summary>
Svg to use for a menu icon</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;history: false,</summary>
Reflect state in url</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;session: true,</summary>
Save/load state between sessions, on load is overridden by history</details>
<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;storage: window.sessionStorage</summary>
Default storage</details>
</details>

<details><summary>prama.show();</summary>
Show or hide params menu
</details>
<details><summary>prama.hide();</summary>
Show or hide params menu
</details>

<details><summary>prama.on('change', (name, value, opts) => {});</summary>
Hook up a callback for any parameter change.
</details>

<details><summary>prama.toString();</summary>
Get string representation of state
</details>

<details><summary>prama.get(name?)</summary>
Get single property value. If name is omitted - return full state.
</details>

<details><summary>prama.set(name?, value|options?) or prama.set(fields)</summary>
Set field value, of if an object passed - update state with passed values.
</details>


## See also

* [settings-panel](https://github.com/freeman-lab/settings-panel) — setting panel used by prama.
* [popoff](https://github.com/dfcreative/popoff) — any type of popup, modal, dropdown etc.
* [start-app](https://github.com/dfcreative/start-app) — demo page for components.
* [tst](https://github.com/dfcreative/tst) — minimalistic test runner.
* [dat.gui](https://github.com/dataarts/dat.gui) — other oldschool settings panel.

## Credits

Thanks to [freepik.com](http://www.freepik.com/free-vector/flower-mandala-ornaments_714316.htm#term=mandala&page=1&position=12) for astonishing illustration used for logo.