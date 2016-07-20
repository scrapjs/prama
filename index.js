/**
 * @module  prama
 */

const inherits = require('inherits');
const extend = require('just-extend');
const createPopup = require('popoff');
const isMobile = require('is-mobile');
const isPlainObject = require('is-plain-obj');
const Emitter = require('events');
const draggable = require('draggy');
const insertCss = require('insert-styles');
const scopeCss = require('scope-css');
const fs = require('fs');
const qs = require('qs');
const createPanel = require('../settings-panel');

module.exports = Prama;


insertCss(fs.readFileSync(__dirname + '/index.css', 'utf-8'));


/**
 * @constructor
 */
function Prama (opts) {
	if (!(this instanceof Prama)) return new Prama(opts);

	extend(this, opts);

	//ensure container, unless it is explicitly false
	if (this.container === undefined) {
		this.container = document.body || document.documentElement;
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
		var loadedValues = this.load();
	}

	//prepare argument for settings panel
	var paramList = [];
	for (let name in this.fields) {
		let item = this.fields[name];
		if (!item.label) item.label = name;

		//save initial value, as we need it to exclude from serialization
		item.initial = item.value;

		//apply loaded value
		if (this.session && loadedValues[name] !== undefined) item.value = loadedValues[name];

		paramList.push(item);
	}
	paramList = paramList.sort((a, b) => (a.order || 0) - (b.order || 0));

	//create control panel
	this.panel = createPanel(paramList, {
		title: this.title,
		container: this.container
	});

	this.id = this.panel.id;

	this.panel.on('change', (data, value, state) => {
		this.emit('change', data, value, state);
		this.session && this.save(state);
	});

	//create settings button
	this.button = document.createElement('a');
	this.button.href = '#settings';
	this.button.classList.add('prama-button');
	this.button.innerHTML = `<i>${this.icon}</i>`;
	this.button.title = this.title;
	this.button.addEventListener('click', (e) => {
		e.preventDefault();
	});

	//create settings button and popup
	if (this.popup) {
		if (typeof this.popup === 'string') this.popup = {type: this.popup};
		this.popup = this.popup || {};
		this.popup = createPopup(extend(this.popup, {
			target: this.button,
			content: this.panel.element
		}));

		if (this.draggable) {
			this.dragman = draggable(this.popup.element, {
				handle: typeof this.draggable === 'string' ? this.draggable : '.settings-panel-title'
			});
		}

		this.popup.on('afterShow', () => {
			this.dragman.update();
		});
	}

	this.element = this.popup && this.popup.element || this.panel.element;

	this.element.classList.add('prama');
	this.element.classList.add('prama-' + this.id);

	//if container is passed - place ui to it
	if (this.container) {
		this.container.appendChild(this.button);
		this.container.classList.add('prama-container');
		this.container.classList.add('prama-container-' + this.id);
	}

	this.update();
}

inherits(Prama, Emitter);


//default container
Prama.prototype.container;

//default theme
Prama.prototype.theme = () => ``;

//apply theme/orientation/position/other params changes
Prama.prototype.update = function (opts) {
	extend(this, opts);

	this.panel.update({
		title: this.title,
		orientation: this.orientation
	});

	let css = this.theme instanceof Function ? this.theme.call(this, opts) : this.theme+'';
	css = scopeCss(css, '.prama-container-' + this.id).trim();

	insertCss(css, {
		id: this.id
	});
};

//palette for the theme, see nice-color-palettes module
Prama.prototype.palette;

//labels orientation
Prama.prototype.orientation = createPanel.prototype.orientation;

//popup type
Prama.prototype.popup = {
	type: 'modal',
	overlay: false,
	wrap: false,
	side: 'center'
};

//title for the panel
Prama.prototype.title = '';

//make panel draggable
Prama.prototype.draggable = true;

//default position
Prama.prototype.position = 'top-right';

//show params button
Prama.prototype.button = true;

//settings button and settings popup
Prama.prototype.icon = fs.readFileSync(__dirname + '/gear.svg');

//reflect state in query
Prama.prototype.history = false;

//save/load params to local storage
Prama.prototype.session = true;

//storage key
Prama.prototype.key = 'prama';

//local storage
Prama.prototype.storage = self.sessionStorage || self.localStorage;


//show/hide popup
Prama.prototype.show = function () {this.popup && this.popup.show(); return this;};
Prama.prototype.hide = function () {this.popup && this.popup.hide(); return this;};





//save params state to local storage
Prama.prototype.save = function (params) {
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
Prama.prototype.saveSession = function (params) {
	if (!this.storage) return false;

	params = params || this.toJSON();

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
Prama.prototype.saveHistory = function (params) {
	var str = this.toString(params);

	location.hash = str;

	return true;
};

//convert to string
Prama.prototype.toString = function (params) {
	params = params || this.toJSON();

	var str = '';
	try {
		str = qs.stringify(params, {encode: false});
	} catch (e) {
		console.error(e);
		return '';
	}

	return str;
}

//get object with filtered values
Prama.prototype.toJSON = function () {
	let params = this.panel.get();

	//convert to string
	for (let name in params) {
		if (params[name].save === false) delete params[name];
		let value = params[name];
		if (value === this.panel.items[name].initial) delete params[name];
		params[name] = toString(params[name]);
		if (value === this.panel.items[name].initial) delete params[name];
	}

	return params;
}

//load params state from local storage
Prama.prototype.load = function () {
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
Prama.prototype.loadSession = function () {
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
Prama.prototype.loadHistory = function () {
	var params = qs.parse(location.hash.slice(1));

	if (!params) return {};

	for (let name in params) {
		params[name] = fromString(params[name]);
	}

	return params;
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
	if (typeof value !== 'string') return value;
	if (value === '✔' || value === 'true') return true;
	if (value === '✘' || value === 'false') return false;
	if (/\,/.test(value) && !/\s/.test(value)) {
		return value.split(',').map(fromString);
	}
	if (!isNaN(parseFloat(value))) return parseFloat(value);
	return value;
}
