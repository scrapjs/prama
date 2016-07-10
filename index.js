/**
 * @module  prama
 */

const inherits = require('inherits');
const extend = require('xtend/mutable');
const createPopup = require('popoff');
const isMobile = require('is-mobile');
const isPlainObject = require('mutype/is-object');
const isPrimitive = require('mutype/is-plain');
const Emitter = require('events');
const draggable = require('draggy');
const insertCSS = require('insert-css');
const fs = require('fs');
const qs = require('qs');
const autosize = require('autosize');
const createPanel = require('../control-panel');

module.exports = Params;


insertCSS(fs.readFileSync(__dirname + '/index.css', 'utf-8'));


//param names mapping to control-panel’s names
const ALIAS = {
	'range': 'range',
	'number': 'range',

	'interval': 'interval',
	'multirange': 'interval',
	'diapasone': 'interval',

	'switch': 'select',
	'radio': 'select',
	'list': 'select',

	'initial': 'initial',
	'value': 'initial',
	'default': 'initial',

	'options': 'options',
	'values': 'options',

	'label': 'label',
	'name': 'label',

	'input': 'input',
	'change': 'input',
};


/**
 * @constructor
 */
function Params (opts) {
	if (!(this instanceof Params)) return new Params(opts);

	extend(this, opts);

	//ensure container, unless it is explicitly false
	if (this.container === undefined) {
		this.container = document.body || document.documentElement;
	}

	if (this.container) {
		this.container.classList.add('prama-container');
	}

	//convert params to object
	if (Array.isArray(this.fields)) {
		var cache = {};
		this.fields.forEach((param) => {
			cache[param.label] = param;
		});
		this.fields = cache;
	}
	else {
		this.fields = this.fields || {};
	}


	//load, if defined
	if (this.session) {
		var loadedParams = this.load();
	}

	//set loaded params to initial values
	for (var name in loadedParams) {
		this.fields[name].initial = loadedParams[name];
	}

	//prepare argument for control panel
	var paramList = [];
	for (let name in this.fields) {
		let item = this.fields[name];
		if (!item.label) item.label = name;

		// detect item type, if undefined, from other options
		if (!item.type) {
			if (item.initial && Array.isArray(item.initial)) {
				item.type = 'interval'
			} else if (item.scale || item.max || item.steps || typeof item.initial === 'number') {
				item.type = 'range'
			} else if (item.options) {
				item.type = 'select'
			} else if (item.format) {
				item.type = 'color'
			} else if (typeof item.initial === 'boolean') {
				item.type = 'checkbox'
			} else if (item.action) {
				item.type = 'button'
			} else {
				item.type = 'text'
			}
		}

		paramList.push(item);
	}

	paramList = paramList.sort((a, b) => (a.order || 0) - (b.order || 0));

	//create control panel
	this.panel = createPanel(paramList, {
		title: this.title,
		theme: this.theme,
		root: this.container
	});

	this.panel.box.classList.add('prama');

	//update state on change
	if (this.session) {
		this.panel.on('input', (data) => {
			this.save(data);
		});
	}

	//create settings button
	this.button = document.createElement('a');
	this.button.href = '#settings';
	this.button.classList.add('prama-settings-button');
	this.button.innerHTML = `<i>${this.icon}</i>`;
	this.button.title = this.title;
	this.button.addEventListener('click', (e) => {
		e.preventDefault();
	});

	//create settings button and popup
	// this.popup = createPopup(extend(this.popup, {
	// 	target: this.button,
	// 	content: this.element
	// }));
	// this.draggable = draggable(this.popup.element);

	//if container is passed - place ui to it
	if (this.container) {
		this.container.appendChild(this.button);
	}
}

inherits(Params, Emitter);


//default container
Params.prototype.container;

//default theme
Params.prototype.theme = 'light'; /*{
	fontFamily: 'sans-serif',
	fontSize: '14px',
	background1: 'rgb(227,227,227)',
	background2: 'rgb(204,204,204)',
	background2hover: 'rgb(208,208,208)',
	foreground1: 'rgb(105,105,105)',
	text1: 'rgb(36,36,36)',
	text2: 'rgb(87,87,87)'
};*/

//popup type
Params.prototype.popup = {
	type: 'modal',
	overlay: false,
	wrap: false
};

//title for the panel
Params.prototype.title = '';

//make panel draggable
Params.prototype.draggable = true;

//default position
Params.prototype.position = 'top-right';

//show params button
Params.prototype.button = true;

//settings button and settings popup
Params.prototype.icon = fs.readFileSync(__dirname + '/gear.svg');

//reflect state in query
Params.prototype.history = false;

//save/load params to local storage
Params.prototype.session = true;

//storage key
Params.prototype.key = 'prama';

//local storage
Params.prototype.storage = self.sessionStorage || self.localStorage;

//save params state to local storage
Params.prototype.save = function (params) {
	if (!params) return false;

	if (this.session) {
		this.saveSession(params);
	}

	if (this.history) {
		this.saveHistory(params);
	}

	return true;
};

//put state into storage
Params.prototype.saveSession = function (params) {
	if (!this.storage) return false;

	//convert to string
	for (let name in params) {
		let value = params[name];
		if (value === this.params[name].default) delete params[name];
		params[name] = toString(params[name]);
		if (value === this.params[name].default) delete params[name];
	}

	try {
		var str = JSON.stringify(params);
	} catch (e) {
		console.error(e);
		return false;
	}

	if (!str) return false;
	this.storage.setItem(this.key, str);

	return true;
};

//put params into location
Params.prototype.saveHistory = function (params) {
	var str = this.toString(params);

	location.hash = str;

	return true;
};

//load params state from local storage
Params.prototype.load = function () {

	var values = {};

	//load session
	if (this.session) {
		values = this.loadSession();
	}

	//load history (overwrite)
	if (this.history) {
		values = extend(values, this.loadHistory());
	}

	return values;
};

//load params from session
Params.prototype.loadSession = function () {
	if (!this.storage) return {};

	var str = this.storage.getItem(this.key);
	if (!str) return {};

	try {
		var values = JSON.parse(str);
	}
	catch (e) {
		console.error(e);
		return {};
	}

	if (!values) return {};

	//convert from string
	for (let name in values) {
		values[name] = fromString(values[name]);
	}

	return values;
};

//load params from history
Params.prototype.loadHistory = function () {
	var params = qs.parse(location.hash.slice(1));

	if (!params) return {};

	for (let name in params) {
		params[name] = fromString(params[name]);
	}

	return params;
}

//show/hide popup
Params.prototype.show = function () {this.popup && this.popup.show(); return this;};
Params.prototype.hide = function () {this.popup && this.popup.hide(); return this;};

//return value of defined param
Params.prototype.getParam = function (name) {
	return this.panel.state[name];
}

//get cache of params
Params.prototype.getParams = function (whitelist) {
	return this.panel.state;
}

//set param value/options
Params.prototype.setParamValue = function (name, value) {
	var sourceTarget;
	if (value instanceof Element) {
		sourceTarget = value;
		value = getValue(sourceTarget);
	}

	var param = this.params[name];

	param.value = value;
	param.element.title = `${param.label || param.name}: ${param.value}`;

	param.change && param.change.call(this, value, param);
	this.emit('change', param.name, param.value, param);

	//update ui
	var targets = param.element.querySelectorAll('input, select, button, textarea, fieldset');
	[].forEach.call(targets, target => {
		if (target === sourceTarget) return;

		if (target.type === 'radio') return;

		if (target.classList.contains('ghost')) {
			target = target.parentNode.querySelector('.original');
		}

		if (target.classList.contains('original')) {
			target.valueLow = value[0];
			target.valueHigh = value[1];
			return;
		}

		setValue(target, value);
	});
}

//convert to string
Params.prototype.toString = function (params) {
	params = params || this.getParams();

	//convert to string
	for (let name in params) {
		let value = params[name];
		if (value === this.params[name].initial) delete params[name];
		params[name] = toString(params[name]);
		if (value === this.params[name].initial) delete params[name];
	}

	var str = '';
	try {
		str = qs.stringify(params, {encode: false});
	} catch (e) {
		console.error(e);
		return '';
	}

	return str;
}



// BLOODY HELPERS

//convert value to string
function toString (value) {
	if (value === true) return '✔';
	if (value === false) return '✘';
	return value + '';
}

//get value from string
function fromString (value) {
	if (value === '✔' || value === 'true') return true;
	if (value === '✘' || value === 'false') return false;
	if (/\,/.test(value) && !/\s/.test(value)) {
		return value.split(',').map(fromString);
	}
	if (!isNaN(parseFloat(value))) return parseFloat(value);
	return value;
}
