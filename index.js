/**
 * @module  biloba
 */

const inherits = require('inherits');
const extend = require('xtend/mutable');
const createPopup = require('popoff');
const isMobile = require('is-mobile');
const isPlainObject = require('mutype/is-object');
const isPrimitive = require('mutype/is-plain');
const Emitter = require('events');
const insertCSS = require('insert-css');
const fs = require('fs');
const qs = require('qs');
const autosize = require('autosize');


module.exports = Params;


insertCSS(fs.readFileSync(__dirname + '/index.css', 'utf-8'));


/**
 * @constructor
 */
function Params (params, opts) {
	if (!(this instanceof Params)) return new Params(params, opts);

	extend(this, opts);

	//create content
	this.element = document.createElement('form');
	this.element.classList.add('prama');

	//ensure container, unless it is explicitly false
	if (!this.container && this.container !== false && this.container !== null) {
		this.container = document.body || document.documentElement;
	}

	if (this.container) {
		this.container.classList.add('prama-container');
	}

	//create title
	this.titleElement = document.createElement('h2');
	this.titleElement.classList.add('prama-title');

	if (this.title || this.title === '') {
		this.titleElement.innerHTML = this.title;
		this.element.appendChild(this.titleElement);
	}

	//params cache by names
	this.params = {};


	//load, if defined
	if (this.session) {
		var loadedParams = this.load();

		let saveTo;
		this.on('change', () => {
			if (saveTo) return;
			saveTo = setTimeout(() => {
				var params = this.getParams();
				this.save(params);
				saveTo = null;
			}, 100);
		});
	}

	//create params from list
	this.setParams(params, loadedParams);

	//create settings button and popup
	this.popup = createPopup(extend(this.popup, {
		content: this.element
	}));

	this.button = document.createElement('a');
	this.button.href = '#settings';
	this.button.classList.add('prama-settings-button');
	this.button.innerHTML = `<i>${this.icon}</i>`;
	this.button.title = this.titleElement.textContent;
	this.button.addEventListener('click', (e) => {
		e.preventDefault();
		this.popup.show();
	});

	//if container is passed - place ui to it
	if (this.container) {
		this.container.appendChild(this.button);
	}
}

inherits(Params, Emitter);


//default container
Params.prototype.container;

//popup type
Params.prototype.popup = {
	type: 'modal'
};

//settings button and settings popup
Params.prototype.icon = fs.readFileSync(__dirname + '/gear.svg');


//show/hide popup
Params.prototype.show = function () {this.popup && this.popup.show(); return this;};
Params.prototype.hide = function () {this.popup && this.popup.hide(); return this;};


/** Create params based off list */
Params.prototype.setParams = function (list, loaded) {
	if (isPlainObject(list)) {
		for (let name in list) {
			let item = list[name];

			//function initializing param
			if (item instanceof Function) {
				this.once('set', () => {
					this.setParam(name, item.call(this));
				});
			}
			//
			else if (item instanceof HTMLElement) {
				item = {
					create: item
				};
			}
			else {
				item = isPlainObject(item) ? item : { value: item };
			}

			if (loaded && loaded[name] !== undefined) {
				if (item.default === undefined) {
					item.default = item.value;
				}
				item.value = loaded[name];
			}

			this.setParam(name, item);
		}
	}
	else if (Array.isArray(list)){
		list.forEach((item) => {
			if (item instanceof Function) {
				this.once('set', () => {
					this.setParam(item.call(this));
				});
				return;
			}
			var name = item.name;
			if (loaded && loaded[name] !== undefined) {
				if (item.default === undefined) item.default = item.value;
				item.value = loaded[name];
			}
			this.setParam(item);
		});
	}

	this.emit('set');

	return this;
}

//create new param or set value of existing param
Params.prototype.setParam = function (name, param, cb) {
	//sort out args
	//setParam({}, ...)
	if (isPlainObject(name)) {
		cb = param;
		param = name;
		name = param.name
	}
	//setParam(_, fn)
	if (param instanceof Function) {
		cb = param;
		param = {name: name};
	}
	//setParam(_, 0.5, _)
	if (!isPlainObject(param)) {
		if (this.params[name]) return this.setParamValue(name, param);
		param = {value: param};
	}

	if (typeof name === 'string') {
		param.name = name;
	}

	if (!param.name) {
		throw Error('Define `name` for parameter ' + JSON.stringify(param));
	}

	//normalize param
	param = this.params[param.name] = extend(this.params[param.name] || {}, param);

	param.change = cb || param.change || param.onchange;

	if (!param.type) {
		if (param.values) {
			param.type = 'select';
		}
		else if (param.min || param.max || param.step || typeof param.value === 'number') {
			param.type = 'range';
		}
		else if (Array.isArray(param.value)) {
			param.type = 'multirange';
		}
		else if (typeof param.value === 'boolean') {
			param.type = 'checkbox';
		}
	}

	if (param.label === undefined) {
		if (param.create) {
			param.label = null;
		}
		else {
			param.label = param.name.slice(0,1).toUpperCase() + param.name.slice(1);
		}
	}

	var label = '';
	if (param.label != null) {
		label = `<label for="${param.name}" class="prama-label" title="${param.label}">${param.label}</label>`
	};

	var el = document.createElement('div');
	el.classList.add('prama-param');

	//custom create
	if (param.create) {
		if (param.save == null) param.save = false;

		if (param.create instanceof Function) {
			var html = param.create.call(param, param);
		}
		else {
			var html = param.create;
		}

		el.innerHTML = label;

		if (html instanceof Element) {
			el.appendChild(html);
		}
		else {
			el.innerHTML += html;
		}
	}

	//default type
	else {
		var html = '';

		switch (param.type) {
			case 'select':
				html += `<select
					id="${name}" class="prama-input prama-select" title="${param.value}">`;

				if (Array.isArray(param.values)) {
					for (var i = 0; i < param.values.length; i++) {
						html += `<option value="${param.values[i]}" ${param.values[i] === param.value ? 'selected' : ''}>${param.values[i]}</option>`
					}
				}
				else {
					for (let name in param.values) {
						html += `<option value="${param.values[name]}" ${param.values[name] === param.value ? 'selected' : ''}>${name}</option>`
					}
				}
				html += `</select><span class="prama-select-arrow">▼</span>`;

				break;

			case 'number':
			case 'range':
			case 'interval':
			case 'diapason':
			case 'multirange':
				var multiple = param.type === 'multirange' || param.type === 'interval';
				var value = param.value != null ? (typeof param.value === 'number' ? param.value : parseFloat(param.value)) : NaN;
				if (isNaN(value)) value = param.max ? param.max / 2 : 50;
				if (multiple) {
					if (!Array.isArray(param.value)) {
						param.value = [value, value];
					}
				} else {
					param.value = value;
				}
				param.min = param.min != null ? param.min : 0;
				param.max = param.max != null ? param.max : (multiple ? Math.max.apply(Math, param.value) : param.value) < 1 ? 1 : 100;
				param.step = param.step != null ? param.step : (multiple ? Math.max.apply(Math, param.value) : param.value) < 1 ? .01 : 1;

				html += `<input id="${param.name}" type="range" class="prama-input prama-range prama-value" value="${param.value}" min="${param.min}" max="${param.max}" step="${param.step}" title="${param.value}" ${multiple ? 'multiple' : ''}/>`;
				if (!multiple) {
					html += `<input id="${param.name}-number" value="${param.value}" class="prama-input prama-value" type="number" min="${param.min}" max="${param.max}" step="${param.step}" title="${param.value}"/>`;
				}
				else {
					html += `<input id="${param.name}-number" value="${param.value}" class="prama-input prama-value" type="text" title="${param.value}"/>`;
				}

				break;

			case 'checkbox':
			case 'toggle':
				param.value = param.value == null ? false : param.value;

				html += `<label class="prama-toggle">
					<input type="checkbox" id="${param.name}" class="prama-input" ${param.value ? 'checked' : ''}/>
					<div class="prama-toggle-thumb"></div>
				</label>`;

				break;

			case 'button':
				if (param.save == null) param.save = false;
				html = `<button id="${param.name}" class="prama-input prama-button"
				>${ param.value }</button>`;
				break;

			case 'submit':
			case 'reset':
				if (param.save == null) param.save = false;
				html = `<input id="${param.name}" class="prama-input prama-button"
				value="${ param.value }" title="${param.title}" type="${ param.type }"/>`;
				break;

			case 'radio':
			case 'switch':
			case 'multiple':
			case 'list':
				html = `<fieldset id="${param.name}" class="prama-radio">`;

				if (Array.isArray(param.values)) {
					for (var i = 0; i < param.values.length; i++) {
						html += `<label for="${param.values[i]}"><input type="radio" value="${param.values[i]}" ${param.values[i] === param.value ? 'checked' : ''} id="${param.values[i]}" name="${param.name}"/> ${param.values[i]}</label>`;
					}
				}
				else {
					for (let name in param.values) {
						html += `<label for="${name}"><input type="radio" value="${param.values[name]}" ${param.values[name] === param.value ? 'checked' : ''} id="${name}" name="${param.name}"/> ${param.values[name]}</label>`;
					}
				}

				html += `</fieldset>`;

				break;

			case 'file':
				throw 'Unimplemented';
				break;

			case 'canvas':
			case 'output':
				throw 'Unimplemented';
				break;

			case 'textarea' :
				param.value = param.value == null ? '' : param.value;
				html += `<textarea rows="1" placeholder="${param.placeholder || 'value...'}" id="${param.name}" class="prama-input prama-textarea" title="${param.value}">${param.value}</textarea>
				`;

				break;

			default:
				param.value = param.value == null ? '' : param.value;
				html += `<input placeholder="${param.placeholder || 'value...'}" id="${param.name}" class="prama-input prama-text" value="${param.value}" title="${param.value}" ${param.type ? `type="${param.type}"` : ''}/>
				`;

				break;
		}

		if (param.help) {
			html += `<div class="prama-help">${param.help}</div>`;
		}

		el.innerHTML = label + html;
	}

	//if new element - just add listeners and place httm
	if (param.element) {
		param.element.parentNode.replaceChild(el, param.element);
		param.element = el;
	} else {
		param.element = el;
		this.element.appendChild(param.element);
	}

	//apply hidden
	if (param.hidden) {
		param.element.setAttribute('hidden', true);
	}
	else {
		param.element.removeAttribute('hidden');
	}

	//init autosize
	if (param.type === 'textarea') {
		var textarea = param.element.querySelector('textarea');
		textarea && autosize(textarea);
	}

	//init multirange
	if (param.type === 'multirange') {
		var input = param.element.querySelector('input');
		input && multirange(input);
	}

	//watch for change event
	var inputs = param.element.querySelectorAll('input, select, button, textarea, fieldset');

	[].forEach.call(inputs, (input) => {
		input.addEventListener('input', e => {
			this.setParamValue(param.name, e.target);
		});
		input.addEventListener('change', e => {
			this.setParamValue(param.name, e.target);
		});
		if (param.type === 'button' || param.type === 'submit') {
			input.addEventListener('click', e => {
				e.preventDefault();
				this.setParamValue(param.name, e.target);
			});
		}
		input.addEventListener('keypress', e => {
			if (e.which === 13) {
				this.setParamValue(param.name, e.target);
			}
		});
	});

	//preset style
	if (param.style) {
		for (let name in param.style) {
			let v = param.style[name];
			if (typeof v === 'number' && !/ndex/.test(name)) v += 'px';
			param.element.style[name] = v;
		}
	}

	//set serialization
	if (param.save == null) param.save = true;

	if (param.default === undefined) param.default = param.value;

	//init param value
	if (param.type !== 'button' && param.type !== 'submit') {
		//FIXME: >:( setTimeout needed to avoid instant init (before other fields)
		//FIXME: it invokes `change`, which can affect other fields and in result init the whole form in wrong order.
		setTimeout(() => {
			this.setParamValue(param.name, param.value);
		});
	}

	return this;
};

//return value of defined param
Params.prototype.getParam = function (name) {
	if (arguments.length) {
		return this.params[name].value;
	}
	else {
		return this.getParams();
	}
}

//get cache of params
Params.prototype.getParams = function (whitelist) {
	var res = {};
	for (let name in this.params) {
		if (!whitelist || (whitelist && whitelist[name] != null)) {
			if (!this.params[name].save) continue;
			res[name] = this.params[name].value;
		}
	}
	return res;
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


//convert to string
Params.prototype.toString = function (params) {
	params = params || this.getParams();

	//convert to string
	for (let name in params) {
		let value = params[name];
		if (value === this.params[name].default) delete params[name];
		params[name] = toString(params[name]);
		if (value === this.params[name].default) delete params[name];
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


//get value from a dom element
function getValue (target) {
	var value = target.type === 'checkbox' ? target.checked : target.value;

	if (target.type === 'number' || target.type === 'range' || target.type === 'multirange' ) {
		if (target.hasAttribute('multiple')) {
			if (target.classList.contains('ghost')) {
				target = target.parentNode.querySelector('.original');
			}
			value = [target.valueLow, target.valueHigh];
		}
		else {
			value = parseFloat(target.value);
		}
	}

	if (value == null && target.type === 'button') {
		value = target.innerHTML;
	}

	return value;
}

//set value to a dom element
function setValue (target, value) {
	target.value = value;

	if (target.type === 'checkbox' || target.type === 'radio') {
		target.checked = !!value;
	}

	if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
		target.innerHTML = value;
	}

	//FIXME: seems that select gets updated by setting it’s `value`
	// if (target.tagName === 'SELECT') {
	// 	target.querySelector(`option[value=""`)
	// }

	if (target.tagName === 'FIELDSET') {
		var input = target.querySelector(`input[value="${value}"]`);
		if (input) setValue(input, value);
	}
}



//FIXME :'( multirange copy-paste (Lea Verou, please do npm)
//https://github.com/LeaVerou/multirange
var supportsMultiple = HTMLInputElement && "valueLow" in HTMLInputElement.prototype;

var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");

function multirange (input) {
	if (supportsMultiple || input.classList.contains("multirange")) {
		return;
	}

	var values = input.getAttribute("value").split(",");
	var max = +input.max || 100;
	var ghost = input.cloneNode();

	input.classList.add("multirange", "original");
	ghost.classList.add("multirange", "ghost");

	input.value = values[0] || max / 2;
	ghost.value = values[1] || max / 2;

	input.parentNode.insertBefore(ghost, input.nextSibling);

	Object.defineProperty(input, "originalValue", descriptor.get ? descriptor : {
		// Fuck you Safari >:(
		get: function() { return this.value; },
		set: function(v) { this.value = v; }
	});

	Object.defineProperties(input, {
		valueLow: {
			get: function() { return Math.min(this.originalValue, ghost.value); },
			set: function(v) { this.originalValue = v; },
			enumerable: true
		},
		valueHigh: {
			get: function() { return Math.max(this.originalValue, ghost.value); },
			set: function(v) { ghost.value = v; },
			enumerable: true
		}
	});

	if (descriptor.get) {
		// Again, fuck you Safari
		Object.defineProperty(input, "value", {
			get: function() { return this.valueLow + "," + this.valueHigh; },
			set: function(v) {
				if (typeof v === 'string') {
					v = v.split(",");
				}
				this.valueLow = v[0];
				this.valueHigh = v[1];
			},
			enumerable: true
		});
	}

	function update() {
		ghost.style.setProperty("--low", input.valueLow * 100 / max + 1 + "%");
		ghost.style.setProperty("--high", input.valueHigh * 100 / max - 1 + "%");
	}

	input.addEventListener("input", update);
	ghost.addEventListener("input", update);

	update();
}
