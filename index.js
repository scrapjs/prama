/**
 * @module  biloba
 */

const inherits = require('inherits');
const extend = require('xtend');
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

	extend(this, opts);

	//create content
	this.element = document.createElement('form');
	this.element.classList.add('prama');

	//params cache by names
	this.params = {};

	if (this.title) {
		this.element.innerHTML = `<h2 class="prama-title">${ this.title }</h2>`;
	}

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

Params.prototype.title = 'Settings';

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
	param = this.params[param.name] = extend(this.params[param.name], param);

	param.change = cb || param.change || param.onchange;

	if (!param.type) {
		if (param.values) {
			param.type = 'select';
		}
		else if (param.min || param.max || param.step || typeof param.value === 'number') {
			param.type = 'range';
		}
		else if (typeof param.value === 'boolean') {
			param.type = 'checkbox';
		}
	}

	if (!param.label) {
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

					break;

				case 'number':
				case 'range':
					param.value = param.value == null ? 0.5 : param.value;
					param.min = param.min != null ? 0 : param.min;
					param.max = param.max != null ? 100 : param.max;
					param.step = param.step != null ? 0.01 : param.step;
					html += `<input
						id="${param.name}" type="${param.type}" class="prama-input prama-${param.type}" value="${param.value}" min="${param.min}" max="${param.max}" step="${param.step}" title="${param.value}"/>
					`;

					if (param.type === 'range')	{
						html += `<span class="prama-value">${param.value}</span>`;
					}

					break;

				case 'checkbox':
				case 'toggle':
					param.value = param.value == null ? false : param.value;
					html += `<input
						id="${param.name}" type="checkbox" class="prama-input prama-${param.type}" title="${param.value}" ${param.value ? 'checked' : ''}/>
					`;

					break;

				case 'button':
					html = `<button
						id="${param.name}" class="prama-input prama-button"
					>${ param.value }</button>`;
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
					break;

				case 'file':
					break;

				default:
					param.value = param.value == null ? '' : param.value;
					html += `<input placeholder="${param.placeholder || 'value...'}" id="${param.name}" class="prama-input prama-text" value="${param.value}" title="${param.value}" ${param.type ? 'type="${param.type}"' : ''}/>
					`;

					break;
			}

			param.element.insertAdjacentHTML('beforeend', html);

			var input = param.element.querySelector('input, select, button');

			if (input) {
				input.addEventListener('input', e => {
					this.setParamValue(param.name, getValue(e.target));
				});
				input.addEventListener('change', e => {
					this.setParamValue(param.name, getValue(e.target));
				});
				if (param.type === 'button' || param.type === 'submit') {
					input.addEventListener('click', e => {
						e.preventDefault();
						this.setParamValue(param.name, getValue(e.target));
					});
				}
				input.addEventListener('keypress', e => {
					if (e.which === 13) {
						this.setParamValue(param.name, getValue(e.target));
					}
				});
			}
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
	var param = this.params[name];

	param.element.title = value;
	param.value = value;
	param.change && param.change.call(self, value, param);

	//update ui
	if (getValue(param.element) !== value) {
		var target = param.element.querySelector('input, select, button');
		target.value = value;
		if (target.type === 'checkbox') {
			target.checked = !!value;
		}

		var valueEl = param.element.querySelector('.prama-value');
		if (valueEl) {
			valueEl.innerHTML = value;
		}
	}


	this.emit('change', param.name, param.value, param);
}


//get value from a dom element
function getValue (target) {
	var value = target.type === 'checkbox' ? target.checked : (target.type === 'number' || target.type === 'range') ? parseFloat(target.value) : target.value;

	if (value == null && target.type === 'button') {
		value = target.innerHTML ;
	}

	return value;
}
