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


module.exports = Params;


insertCSS(fs.readFileSync('./index.css', 'utf-8'));


/**
 * @constructor
 */
function Params (params, opts) {
	if (!(this instanceof Params)) return new Params(params, opts);

	//create content
	this.element = document.createElement('form');
	this.element.classList.add('prama');

	this.titleElement = document.createElement('h2');
	this.titleElement.classList.add('prama-title');
	this.titleElement.innerHTML = this.title;
	this.titleElement.setAttribute('hidden', true);
	this.element.appendChild(this.titleElement);

	extend(this, opts);


	//params cache by names
	this.params = {};


	//create params from list
	this.param(params);

	/*
	//extend params with the read history state
	if (this.history) {
		var params = qs.parse(location.hash.slice(1));
	}

	this.addParams(this.params);

	if (this.history) {
		for (var param in params){
			var value = params[param];
			if (value.toLowerCase() === 'false') {
				value = false;
			}
			else if (value.toLowerCase() === 'true') {
				value = true;
			}
			else if (/[-0-9\.]+/.test(value)) {
				value = parseFloat(value);
			}
			this.setParamValue(param, value);
		}
	}

	//update history
	if (this.history) {
		this._wait = false;
		this.on('change', () => {
			if (this._wait) return;

			this.updateHistory();

			this._wait = true;
			setTimeout(() => {
				this._wait = false;
			}, 100);
		});
	}

	if (this.params) {
		this.paramsBtn.removeAttribute('hidden');
	} else {
		this.paramsBtn.setAttribute('hidden', true);
	}

	this.updateHistory();
	*/
}

inherits(Params, Emitter);

Object.defineProperties(Params.prototype, {
	title: {
		get: function () {
			return this.titleElement.innerHTML;
		},
		set: function (value) {
			if (!value) {
				this.titleElement.innerHTML = '';
				this.titleElement.setAttribute('hidden', true);
			}
			else {
				if (!this.titleElement.innerHTML) {
					this.titleElement.removeAttribute('hidden');
				}
				this.titleElement.innerHTML = value;
			}
		}
	}
});


//update hash state
Params.prototype.updateHistory = function () {
	// if (!this.history) return;

	// var params = {};
	// this.paramsList.forEach((param) => {
	// 	params[param.name] = param.value;
	// });

	// location.hash = '#' + qs.stringify(params);
}


/**
 * Universal param method
 */
Params.prototype.param = function (a, b, c) {
	if (arguments.length === 1) {
		//param('name')
		if (isPrimitive(a)) return this.getParam(a);
		//param([...])
		//param({...})
		return this.setParams(a);
	}
	else if (arguments.length) {
		//param('key', 'value'|opts, cb?)
		return this.setParam(a, b, c);
	}
	else {
		return this.getParam();
	}
};


/** Create params based off list */
Params.prototype.setParams = function (list) {
	if (isPlainObject(list)) {
		for (var name in list) {
			this.setParam(name, list[name]);
		}
	}
	else if (Array.isArray(list)){
		list.forEach((item) => this.setParam(item));
	}

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

	if (param.label == null) {
		param.label = param.name.slice(0,1).toUpperCase() + param.name.slice(1);
	}


	//create element
	if (!param.element) {
		param.element = document.createElement('div');
		param.element.innerHTML = `<label for="${param.name}">${param.label}</label>`;

		//custom create
		if (param.create) {
			var el = param.create.call(param, param);
			if (el instanceof HTMLElement) {
				param.element.appendChild(el);
			}
			else {
				param.element.insertAdjacentHTML('beforeend', el);
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
						for (var name in param.values) {
							html += `<option value="${param.values[name]}" ${param.values[name] === param.value ? 'selected' : ''}>${name}</option>`
						}
					}
					html += `</select>`;
					param.element.insertAdjacentHTML('beforeend', html);

					break;

				case 'number':
				case 'range':
				case 'multirange':
					param.multiple = param.type === 'multirange';
					param.value = param.value != null ? param.value : param.max ? param.max / 2 : 50;
					param.min = param.min != null ? param.min : 0;
					param.max = param.max != null ? param.max : (param.multiple ? Math.max.apply(Math, param.value) : param.value) < 1 ? 1 : 100;
					param.step = param.step != null ? param.step : (param.multiple ? Math.max.apply(Math, param.value) : param.value) < 1 ? .01 : 1;
					html += `<input id="${param.name}" type="range" class="prama-input prama-range prama-value" value="${param.value}" min="${param.min}" max="${param.max}" step="${param.step}" title="${param.value}" ${param.multiple ? 'multiple' : ''}/>`;
					if (!param.multiple) {
						html += `<input id="${param.name}-number" value="${param.value}" class="prama-input prama-value" type="number" min="${param.min}" max="${param.max}" step="${param.step}" title="${param.value}"/>`;
					}
					else {
						html += `<input id="${param.name}-number" value="${param.value}" class="prama-input prama-value" type="text" title="${param.value}"/>`;
					}
					param.element.insertAdjacentHTML('beforeend', html);

					var input = param.element.querySelector('input');
					param.multiple && multirange(input);

					break;

				case 'checkbox':
				case 'toggle':
					param.value = param.value == null ? false : param.value;
					html += `<input id="${param.name}" type="checkbox" class="prama-input prama-${param.type}" title="${param.value}" ${param.value ? 'checked' : ''}/>
					`;
					param.element.insertAdjacentHTML('beforeend', html);

					break;

				case 'button':
					html = `<button id="${param.name}" class="prama-input prama-button"
					>${ param.value }</button>`;
					param.element.insertAdjacentHTML('beforeend', html);
					break;

				case 'radio':
					html = `<fieldset id="${param.name}" class="prama-radio">`;

					if (Array.isArray(param.values)) {
						for (var i = 0; i < param.values.length; i++) {
							html += `<label for="${param.values[i]}"><input type="radio" value="${param.values[i]}" ${param.values[i] === param.value ? 'checked' : ''} id="${param.values[i]}" name="${param.name}"/> ${param.values[i]}</label>`;
						}
					}
					else {
						for (var name in param.values) {
							html += `<label for="${name}"><input type="radio" value="${param.values[name]}" ${param.values[name] === param.value ? 'checked' : ''} id="${name}" name="${param.name}"/> ${param.values[name]}</label>`;
						}
					}

					html += `</fieldset>`;
					param.element.insertAdjacentHTML('beforeend', html);
					break;

				case 'file':
					break;

				default:
					param.value = param.value == null ? '' : param.value;
					html += `<input placeholder="${param.placeholder || 'value...'}" id="${param.name}" class="prama-input prama-text" value="${param.value}" title="${param.value}" ${param.type ? 'type="${param.type}"' : ''}/>
					`;
					param.element.insertAdjacentHTML('beforeend', html);

					break;
			}

			var inputs = param.element.querySelectorAll('input, select, button');

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
		}

		param.element.classList.add('prama-param');
		this.element.appendChild(param.element);
	}

	return this;
};

//return value of defined param
Params.prototype.getParam = function (name) {
	if (arguments.length) {
		var el = this.paramsEl.querySelector('#' + name.toLowerCase());

		return el && el.type === 'checkbox' ? el.checked : el && el.value;
	}
	else {
		//TODO: return cache of param values
	}
}

//set param value/options
Params.prototype.setParamValue = function (name, value) {
	var sourceTarget;
	if (value instanceof Element) {
		sourceTarget = value;
		value = getValue(sourceTarget);
	}

	var param = this.params[name];

	param.element.title = value;
	param.value = value;
	param.change && param.change.call(self, value, param);
	this.emit('change', param.name, param.value, param);

	//update ui
	var targets = param.element.querySelectorAll('input, select, button');
	[].forEach.call(targets, target => {
		if (target === sourceTarget) return;

		//multirange
		if (target.classList.contains('ghost')) {
			target = target.parentNode.querySelector('.original');
		}

		if (target.classList.contains('original')) {
			target.valueLow = value[0];
			target.valueHigh = value[1];
			return;
		}

		target.value = value;
		if (target.type === 'checkbox') {
			target.checked = !!value;
		}
	});
}


//get value from a dom element
function getValue (target) {
	var value = target.type === 'checkbox' ? target.checked : target.value;

	if (target.type === 'number' || target.type === 'range' || target.type === 'multirange' ) {
		if (target.hasAttribute('multiple')) {
			if (target.classList.contains('ghost')) {
				target = target.parentNode.querySelector('.original');
			}
			value = target.value.split(',').map(v => parseFloat(v));
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
				var values = v.split(",");
				this.valueLow = values[0];
				this.valueHigh = values[1];
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
