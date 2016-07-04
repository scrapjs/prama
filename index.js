(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var this$1 = this;

  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this$1, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var this$1 = this;

  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this$1.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this$1.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/**
 * @module  biloba
 */

var inherits = require('inherits');
var extend = require('xtend/mutable');
var createPopup = require('popoff');
var isMobile = require('is-mobile');
var isPlainObject = require('mutype/is-object');
var isPrimitive = require('mutype/is-plain');
var Emitter = require('events');
var insertCSS = require('insert-css');



module.exports = Params;


insertCSS(".prama {\r\n\tfont-family: sans-serif;\r\n}\r\n\r\n.prama hidden {\r\n\tdisplay: none!important;\r\n}\r\n\r\n.prama * {\r\n\tbox-sizing: border-box;\r\n}\r\n\r\n.prama-title {\r\n\ttext-align: center;\r\n}\r\n\r\n.prama-param {\r\n\tmargin-bottom: 1rem;\r\n\tposition: relative;\r\n}\r\n\r\n.prama-label {\r\n\tfont-size: .95rem;\r\n\tdisplay: inline-block;\r\n\twidth: 20%;\r\n\tvertical-align: top;\r\n\tline-height: 1.6rem;\r\n\tpadding-top: .2em;\r\n\theight: 2rem;\r\n}\r\n\r\n.prama-label + * {\r\n\tmax-width: 60%;\r\n\tdisplay: inline-block;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama-label {\r\n\t\tdisplay: block;\r\n\t\twidth: 100%;\r\n\t}\r\n\t.prama-label + * {\r\n\t\tmax-width: none;\r\n\t}\r\n\t.prama-label:empty {\r\n\t\tdisplay: none;\r\n\t}\r\n}\r\n\r\n.prama-input {\r\n\tfont-size: 1rem;\r\n}\r\n\r\n.prama-help {\r\n\tword-break: break-word;\r\n\tdisplay: inline-block;\r\n\tvertical-align: top;\r\n\twidth: 18%;\r\n\tmargin-left: 1%;\r\n\tpadding-top: .5rem;\r\n\tline-height: 1.2rem;\r\n\tfont-size: .9rem;\r\n\tcolor: #888;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama-help {\r\n\t\tdisplay: block;\r\n\t\twidth: 100%;\r\n\t}\r\n}\r\n\r\n.prama textarea,\r\n.prama input:not([type]),\r\n.prama input[type=\"text\"],\r\n.prama input[type=\"number\"],\r\n.prama input[type=\"range\"],\r\n.prama input[type=\"submit\"],\r\n.prama input[type=\"reset\"],\r\n.prama select,\r\n.prama button,\r\n.prama fieldset {\r\n\t-webkit-appearance: none;\r\n\t-moz-appearance: none;\r\n\tappearance: none;\r\n\tvertical-align: top;\r\n\tdisplay: inline-block;\r\n\t/*line-height: 2rem;*/\r\n\tmin-height: 2rem;\r\n\tmin-width: 2rem;\r\n\tborder: none;\r\n\tmargin: 0;\r\n\tborder-radius: .2222rem;\r\n}\r\n\r\n.prama textarea,\r\n.prama input:not([type]),\r\n.prama input[type=\"text\"],\r\n.prama input[type=\"number\"],\r\n.prama select {\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tbackground: rgb(241, 244, 249);\r\n\twidth: 60%;\r\n\tpadding: .2rem .5rem;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama textarea,\r\n\t.prama input:not([type]),\r\n\t.prama input[type=\"text\"],\r\n\t.prama input[type=\"number\"],\r\n\t.prama select {\r\n\t\twidth: 100%;\r\n\t}\r\n}\r\n\r\n.prama-input:not([type=\"range\"]):focus {\r\n\tbox-shadow: 0 0 0 2px rgb(2, 135, 210);\r\n\toutline: none;\r\n}\r\n\r\n.prama textarea {\r\n\tvertical-align: top;\r\n\tpadding-top: .5rem;\r\n\tline-height: 1.5;\r\n}\r\n\r\n.prama input[type=\"checkbox\"],\r\n.prama input[type=\"radio\"] {\r\n\tmargin: 0;\r\n\tcursor: pointer;\r\n\tbackground: rgb(2, 135, 210);\r\n\tborder-color: rgb(2, 98, 157);\r\n\tfont-weight: bolder;\r\n\tfont-size: 1.4rem;\r\n\tline-height: 1.6rem;\r\n\twidth: 1.6rem;\r\n\theight: 1.6rem;\r\n\tvertical-align: top;\r\n\ttext-align: center;\r\n}\r\n.prama input[type=\"radio\"] {\r\n\tborder-radius: 2rem;\r\n}\r\n\r\n.prama fieldset {\r\n\tpadding: 0;\r\n\theight: auto;\r\n\tbackground: none;\r\n\tvertical-align: top;\r\n\tborder: none;\r\n\twidth: 60%;\r\n\tline-height: 2.4rem;\r\n}\r\n.prama fieldset label {\r\n\twidth: auto;\r\n\tcursor: pointer;\r\n\tline-height: 2rem;\r\n\theight: 2rem;\r\n\tdisplay: inline-block;\r\n\tmargin-right: 1rem;\r\n\tmin-width: 45%;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama fieldset {\r\n\t\twidth: 100%;\r\n\t\tdisplay: block;\r\n\t}\r\n}\r\n\r\n.prama button,\r\n.prama input[type=\"submit\"],\r\n.prama input[type=\"reset\"] {\r\n\tbackground: rgb(2, 135, 210);\r\n\tcolor: white;\r\n\theight: 2.4rem;\r\n\tline-height: 2.4rem;\r\n\tpadding: 0 1rem;\r\n\twidth: 20%;\r\n\tfont-weight: bold;\r\n\tcursor: pointer;\r\n}\r\n\r\n.prama button:active,\r\n.prama input[type=\"submit\"]:active,\r\n.prama input[type=\"reset\"]:active {\r\n\tbackground: rgb(241, 244, 249);\r\n\tcolor: rgb(2, 135, 210);\r\n}\r\n\r\n\r\n/* Hide default HTML checkbox */\r\n.prama-toggle {\r\n  position: relative;\r\n  display: inline-block;\r\n  vertical-align: top;\r\n  width: 4rem;\r\n  height: 2rem;\r\n}\r\n.prama-toggle input {\r\n\tdisplay: none;\r\n}\r\n.prama-toggle .prama-toggle-thumb {\r\n\tposition: absolute;\r\n\tcursor: pointer;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tbackground-color: rgb(241, 244, 249);\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tborder-radius: 34px;\r\n\t-webkit-transition: .4s;\r\n\ttransition: .4s;\r\n}\r\n.prama-toggle .prama-toggle-thumb:before {\r\n\tposition: absolute;\r\n\tborder-radius: 34px;\r\n\tcontent: \"\";\r\n\theight: 1.6rem;\r\n\twidth: 1.6rem;\r\n\tleft: .2rem;\r\n\tbottom: .2rem;\r\n\tbackground-color: white;\r\n\tbox-shadow: 0 1px 2px 1px rgb(231, 234, 249);\r\n\t-webkit-transition: .4s;\r\n\ttransition: .4s;\r\n}\r\n.prama-toggle input:checked + .prama-toggle-thumb {\r\n\tbackground-color: rgb(2, 135, 210);\r\n\tbox-shadow: none;\r\n}\r\n.prama-toggle input:focus + .prama-toggle-thumb {\r\n\tbox-shadow: 0 0 1px rgb(2, 135, 210);\r\n}\r\n.prama-toggle input:checked + .prama-toggle-thumb:before {\r\n\t-webkit-transform: translateX(2rem);\r\n\t-ms-transform: translateX(2rem);\r\n\ttransform: translateX(2rem);\r\n\tbox-shadow: none;\r\n\tbackground-color: white;\r\n}\r\n\r\n\r\n.prama input[type=\"range\"] {\r\n\twidth: 29%;\r\n\tmargin-right: 1%;\r\n\t-webkit-appearance: none;\r\n\t-moz-appearance: none;\r\n\tappearance: none;\r\n\t/** O_o you can’t use height for IE here */\r\n\tpadding: 0;\r\n\tmargin-top: .5rem;\r\n\tmin-height: .5rem;\r\n}\r\n.prama input[type=\"range\"] ~ input:not(.ghost) {\r\n\twidth: 20%;\r\n\tpadding-right: 0;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama input[type=\"range\"] {\r\n\t\twidth: 79%;\r\n\t}\r\n}\r\n\r\n.prama input[type=\"range\"]:focus {\r\n\toutline: none;\r\n}\r\n.prama input[type=\"range\"]::-webkit-slider-runnable-track {\r\n\theight: .5rem;\r\n\tcursor: pointer;\r\n\tbox-shadow: none;\r\n\tbackground: rgb(241, 244, 249);\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tborder-radius: .5rem;\r\n\tborder: none;\r\n\tmargin: .25rem 0 .25rem;\r\n}\r\n.prama input[type=\"range\"]::-webkit-slider-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\theight: 2rem;\r\n\twidth: 2rem;\r\n\tborder-radius: 2rem;\r\n\tbackground: rgb(2, 135, 210);\r\n\tcursor: pointer;\r\n\tmargin-top: -.75rem;\r\n\t-webkit-appearance: none;\r\n}\r\n.prama input[type=\"range\"]:focus::-webkit-slider-runnable-track {\r\n\tbackground: rgb(241, 244, 249);\r\n}\r\n.prama input[type=\"range\"]::-moz-range-track {\r\n\theight: .5rem;\r\n\tcursor: pointer;\r\n\tbox-shadow: none;\r\n\tbackground: rgb(241, 244, 249);\r\n\tborder-radius: .5rem;\r\n\tborder: none;\r\n}\r\n.prama input[type=\"range\"]::-moz-range-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\theight: 2rem;\r\n\twidth: 2rem;\r\n\tborder-radius: 2rem;\r\n\tbackground: rgb(2, 135, 210);\r\n\tcursor: pointer;\r\n}\r\ninput[type=\"range\"]::-ms-track {\r\n\theight: .5rem;\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tcursor: pointer;\r\n\tbackground: transparent;\r\n\tborder-color: transparent;\r\n\tcolor: transparent;\r\n}\r\n\r\ninput[type=\"range\"]::-ms-fill-lower {\r\n\tbackground: rgb(241, 244, 249);\r\n\tborder: none;\r\n\tborder-radius: 26px;\r\n\tbox-shadow: none;\r\n}\r\ninput[type=\"range\"]::-ms-fill-upper {\r\n\tbackground: rgb(241, 244, 249);\r\n\tborder: none;\r\n\tborder-radius: 26px;\r\n\tbox-shadow: none;\r\n}\r\ninput[type=\"range\"]::-ms-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\twidth: 2rem;\r\n\tborder-radius: 2rem;\r\n\tbackground: rgb(2, 135, 210);\r\n\tcursor: pointer;\r\n\theight: .5rem;\r\n}\r\ninput[type=\"range\"]:focus::-ms-fill-lower {\r\n\tbackground: rgb(241, 244, 249);\r\n}\r\ninput[type=\"range\"]:focus::-ms-fill-upper {\r\n\tbackground: rgb(241, 244, 249);\r\n}\r\n\r\n\r\n\r\n\r\n/** multirange polyfill */\r\n@supports (--css: variables) {\r\n\tinput[type=\"range\"].multirange {\r\n\t\tdisplay: inline-block;\r\n\t\tvertical-align: top;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original {\r\n\t\tposition: absolute;\r\n\t\ttop: 0;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original::-webkit-slider-thumb {\r\n\t\tposition: relative;\r\n\t\tz-index: 2;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original::-moz-range-thumb {\r\n\t\ttransform: scale(1); /* FF doesn't apply position it seems */\r\n\t\tz-index: 1;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange::-moz-range-track {\r\n\t\tborder-color: transparent; /* needed to switch FF to \"styleable\" control */\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost {\r\n\t\tposition: relative;\r\n\t\tbackground: var(--track-background);\r\n\t\t--track-background: linear-gradient(to right,\r\n\t\t\t\ttransparent var(--low), var(--range-color) 0,\r\n\t\t\t\tvar(--range-color) var(--high), transparent 0\r\n\t\t\t) no-repeat 0 45% / 100% 40%;\r\n\t\t--range-color: rgb(2, 135, 210);\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost::-webkit-slider-runnable-track {\r\n\t\tbackground: var(--track-background);\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost::-moz-range-track {\r\n\t\tbackground: var(--track-background);\r\n\t}\r\n}\r\n\r\n\r\n\r\n\r\n.prama ::-webkit-input-placeholder { /* Chrome/Opera/Safari */\r\n\tcolor: #bbc;\r\n}\r\n.prama ::-moz-placeholder { /* Firefox 19+ */\r\n\tcolor: #bbc;\r\n}\r\n.prama :-ms-input-placeholder { /* IE 10+ */\r\n\tcolor: #bbc;\r\n}\r\n.prama :-moz-placeholder { /* Firefox 18- */\r\n\tcolor: #bbc;\r\n}");


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
	var this$1 = this;

	if (isPlainObject(list)) {
		for (var name in list) {
			if (!isPlainObject(list[name])) {
				this$1.setParam(name, {
					create: list[name]
				});
			}
			else {
				this$1.setParam(name, list[name]);
			}
		}
	}
	else if (Array.isArray(list)){
		list.forEach(function (item) { return this$1.setParam(item); });
	}

	return this;
}

//create new param or set value of existing param
Params.prototype.setParam = function (name, param, cb) {
	var this$1 = this;

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
			param.label = ''
		}
		else {
			param.label = param.name.slice(0,1).toUpperCase() + param.name.slice(1);
		}
	}


	var label = '';
	if (param.label != null) {
		label = "<label for=\"" + (param.name) + "\" class=\"prama-label\">" + (param.label) + "</label>"
	};

	var el = document.createElement('div');
	el.classList.add('prama-param');

	//custom create
	if (param.create) {
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
				html += "<select\n\t\t\t\t\tid=\"" + name + "\" class=\"prama-input prama-select\" title=\"" + (param.value) + "\">";

				if (Array.isArray(param.values)) {
					for (var i = 0; i < param.values.length; i++) {
						html += "<option value=\"" + (param.values[i]) + "\" " + (param.values[i] === param.value ? 'selected' : '') + ">" + (param.values[i]) + "</option>"
					}
				}
				else {
					for (var name in param.values) {
						html += "<option value=\"" + (param.values[name]) + "\" " + (param.values[name] === param.value ? 'selected' : '') + ">" + name + "</option>"
					}
				}
				html += "</select>";

				break;

			case 'number':
			case 'range':
			case 'multirange':
				var multiple = param.type === 'multirange';
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

				html += "<input id=\"" + (param.name) + "\" type=\"range\" class=\"prama-input prama-range prama-value\" value=\"" + (param.value) + "\" min=\"" + (param.min) + "\" max=\"" + (param.max) + "\" step=\"" + (param.step) + "\" title=\"" + (param.value) + "\" " + (multiple ? 'multiple' : '') + "/>";
				if (!multiple) {
					html += "<input id=\"" + (param.name) + "-number\" value=\"" + (param.value) + "\" class=\"prama-input prama-value\" type=\"number\" min=\"" + (param.min) + "\" max=\"" + (param.max) + "\" step=\"" + (param.step) + "\" title=\"" + (param.value) + "\"/>";
				}
				else {
					html += "<input id=\"" + (param.name) + "-number\" value=\"" + (param.value) + "\" class=\"prama-input prama-value\" type=\"text\" title=\"" + (param.value) + "\"/>";
				}

				break;

			case 'checkbox':
			case 'toggle':
				param.value = param.value == null ? false : param.value;

				html += "<label class=\"prama-toggle\">\n\t\t\t\t\t<input type=\"checkbox\" id=\"" + (param.name) + "\" class=\"prama-input\" " + (param.value ? 'checked' : '') + "/>\n\t\t\t\t\t<div class=\"prama-toggle-thumb\"></div>\n\t\t\t\t</label>";

				break;

			case 'button':
				html = "<button id=\"" + (param.name) + "\" class=\"prama-input prama-button\"\n\t\t\t\t>" + (param.value) + "</button>";
				break;

			case 'submit':
			case 'reset':
				throw 'Unimplemented';
				break;

			case 'radio':
			case 'switch':
			case 'multiple':
			case 'list':
				html = "<fieldset id=\"" + (param.name) + "\" class=\"prama-radio\">";

				if (Array.isArray(param.values)) {
					for (var i = 0; i < param.values.length; i++) {
						html += "<label for=\"" + (param.values[i]) + "\"><input type=\"radio\" value=\"" + (param.values[i]) + "\" " + (param.values[i] === param.value ? 'checked' : '') + " id=\"" + (param.values[i]) + "\" name=\"" + (param.name) + "\"/> " + (param.values[i]) + "</label>";
					}
				}
				else {
					for (var name in param.values) {
						html += "<label for=\"" + name + "\"><input type=\"radio\" value=\"" + (param.values[name]) + "\" " + (param.values[name] === param.value ? 'checked' : '') + " id=\"" + name + "\" name=\"" + (param.name) + "\"/> " + (param.values[name]) + "</label>";
					}
				}

				html += "</fieldset>";

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
				html += "<textarea rows=\"4\" placeholder=\"" + (param.placeholder || 'value...') + "\" id=\"" + (param.name) + "\" class=\"prama-input prama-textarea\" title=\"" + (param.value) + "\">" + (param.value) + "</textarea>\n\t\t\t\t";

				break;

			default:
				param.value = param.value == null ? '' : param.value;
				html += "<input placeholder=\"" + (param.placeholder || 'value...') + "\" id=\"" + (param.name) + "\" class=\"prama-input prama-text\" value=\"" + (param.value) + "\" title=\"" + (param.value) + "\" " + (param.type ? ("type=\"" + (param.type) + "\"") : '') + "/>\n\t\t\t\t";

				break;
		}

		if (param.help) {
			html += "<div class=\"prama-help\">" + (param.help) + "</div>";
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

	if (param.hidden) {
		param.element.setAttribute('hidden', true);
	}
	else {
		param.element.removeAttribute('hidden');
	}

	if (param.type === 'multirange') {
		var input = param.element.querySelector('input');
		input && multirange(input);
	}

	var inputs = param.element.querySelectorAll('input, select, button, textarea, fieldset');

	[].forEach.call(inputs, function (input) {
		input.addEventListener('input', function (e) {
			this$1.setParamValue(param.name, e.target);
		});
		input.addEventListener('change', function (e) {
			this$1.setParamValue(param.name, e.target);
		});
		if (param.type === 'button' || param.type === 'submit') {
			input.addEventListener('click', function (e) {
				e.preventDefault();
				this$1.setParamValue(param.name, e.target);
			});
		}
		input.addEventListener('keypress', function (e) {
			if (e.which === 13) {
				this$1.setParamValue(param.name, e.target);
			}
		});
	});

	//preset style
	if (param.style) {
		for (var name in param.style) {
			var v = param.style[name];
			if (typeof v === 'number' && !/ndex/.test(name)) v += 'px';
			param.element.style[name] = v;
		}
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
		return this.getParams;
	}
}

//get cache of params
Params.prototype.getParams = function (whitelist) {
	var this$1 = this;

	var res = {};
	for (var name in this.params) {
		if (!whitelist || (whitelist && whitelist[name] != null)) {
			res[name] = this$1.params[name];
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

	param.element.title = value;
	param.value = value;

	param.change && param.change.call(this, value, param);
	this.emit('change', param.name, param.value, param);

	//update ui
	var targets = param.element.querySelectorAll('input, select, button, textarea, fieldset');
	[].forEach.call(targets, function (target) {
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
		var input = target.querySelector(("input[value=\"" + value + "\"]"));
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
},{"events":1,"inherits":5,"insert-css":6,"is-mobile":7,"mutype/is-object":23,"mutype/is-plain":24,"popoff":27,"xtend/mutable":30}],3:[function(require,module,exports){
var margins = require('mucss/margin');
var paddings = require('mucss/padding');
var offsets = require('mucss/offset');
var borders = require('mucss/border');
var isFixed = require('mucss/is-fixed');

/**
 * @module
 */
module.exports = align;
module.exports.toFloat = toFloat;


var doc = document, win = window, root = doc.documentElement;



/**
 * Align set of elements by the side
 *
 * @param {NodeList|Array} els A list of elements
 * @param {string|number|Array} alignment Alignment param
 * @param {Element|Rectangle} relativeTo An area or element to calc off
 */
function align(els, alignment, relativeTo){
	if (!els || els.length < 2) throw Error('At least one element should be passed');

	//default alignment is left
	if (!alignment) alignment = 0;

	//default key element is the first one
	if (!relativeTo) relativeTo = els[0];

	//figure out x/y
	var xAlign, yAlign;
	if (alignment instanceof Array) {
		xAlign = toFloat(alignment[0]);
		yAlign = toFloat(alignment[1]);
	}
	//catch y values
	else if (/top|middle|bottom/.test(alignment)) {
		yAlign = toFloat(alignment);
	}
	else {
		xAlign = toFloat(alignment);
	}


	//apply alignment
	var targetRect = offsets(relativeTo);
	if (relativeTo === window) {
		targetRect.top = 0;
		targetRect.left = 0;
	}

	for (var i = els.length, el, s; i--;){
		el = els[i];

		if (el === window) continue;

		//ignore self
		if (el === relativeTo) continue;

		s = getComputedStyle(el);

		//ensure element is at least relative, if it is static
		if (s.position === 'static') el.style.position = 'relative';


		//get relativeTo & parent rectangles
		if (isFixed(el)) {
			var parent = win;
		}
		else {
			var parent = el.offsetParent || win;
		}

		//include margins
		var placeeMargins = margins(el);
		var parentRect = offsets(parent);
		var parentPaddings = paddings(parent);
		var parentBorders = borders(parent);

		parentRect.top += -parentBorders.top + placeeMargins.top;
		parentRect.left += -parentBorders.left + placeeMargins.left;
		parentRect.bottom += -parentBorders.bottom + placeeMargins.bottom;
		parentRect.right += -parentBorders.right + placeeMargins.right;

		//FIXME: I don’t understand why, but for popoff and placer it is required like that
		if (parent !== doc.body) {
			parentRect.top += parentPaddings.top
			parentRect.left += parentPaddings.left;
			parentRect.bottom += parentPaddings.bottom;
			parentRect.right += parentPaddings.right;
		}

		//correct parentRect
		if (parent === window || (parent === doc.body && getComputedStyle(parent).position === 'static') || parent === root) {
			parentRect.left = 0;
			parentRect.top = 0;
		}

		alignX(els[i], targetRect, parentRect, xAlign);
		alignY(els[i], targetRect, parentRect, yAlign);
	}
}




/**
 * Place horizontally
 */
function alignX ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute left
	var desirableLeft = placerRect.left + placerRect.width*align - placee.offsetWidth*align - parentRect.left;

	placee.style.left = desirableLeft + 'px';
	placee.style.right = 'auto';
}


/**
 * Place vertically
 */
function alignY ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute top
	var desirableTop = placerRect.top + placerRect.height*align - placee.offsetHeight*align - parentRect.top;

	placee.style.top = desirableTop + 'px';
	placee.style.bottom = 'auto';
}



/**
 * @param {string|number} value Convert any value passed to float 0..1
 */
function toFloat(value){
	if (typeof value === 'string') {
		//else parse single-value
		switch (value) {
			case 'left':
			case 'top':
				return 0;
			case 'right':
			case 'bottom':
				return 1;
			case 'center':
			case 'middle':
				return 0.5;
		}
		// throw Error('Alignment ' + value + 'is weird');
		return parseFloat(value);
	}

	return value;
}
},{"mucss/border":8,"mucss/is-fixed":12,"mucss/margin":13,"mucss/offset":14,"mucss/padding":15}],4:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],5:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],6:[function(require,module,exports){
var containers = []; // will store container HTMLElement references
var styleElements = []; // will store {prepend: HTMLElement, append: HTMLElement}

module.exports = function (css, options) {
    options = options || {};

    var position = options.prepend === true ? 'prepend' : 'append';
    var container = options.container !== undefined ? options.container : document.querySelector('head');
    var containerId = containers.indexOf(container);

    // first time we see this container, create the necessary entries
    if (containerId === -1) {
        containerId = containers.push(container) - 1;
        styleElements[containerId] = {};
    }

    // try to get the correponding container + position styleElement, create it otherwise
    var styleElement;

    if (styleElements[containerId] !== undefined && styleElements[containerId][position] !== undefined) {
        styleElement = styleElements[containerId][position];
    } else {
        styleElement = styleElements[containerId][position] = createStyleElement();

        if (position === 'prepend') {
            container.insertBefore(styleElement, container.childNodes[0]);
        } else {
            container.appendChild(styleElement);
        }
    }

    // actually add the stylesheet
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText += css
    } else {
        styleElement.textContent += css;
    }

    return styleElement;
};

function createStyleElement() {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    return styleElement;
}

},{}],7:[function(require,module,exports){
module.exports = isMobile;

function isMobile (ua) {
  if (!ua && typeof navigator != 'undefined') ua = navigator.userAgent;
  if (ua && ua.headers && typeof ua.headers['user-agent'] == 'string') {
    ua = ua.headers['user-agent'];
  }
  if (typeof ua != 'string') return false;

  return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4));
}

},{}],8:[function(require,module,exports){
/**
 * Parse element’s borders
 *
 * @module mucss/borders
 */

var Rect = require('./rect');
var parse = require('./parse-value');

/**
 * Return border widths of an element
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.borderLeftWidth),
		parse(style.borderTopWidth),
		parse(style.borderRightWidth),
		parse(style.borderBottomWidth)
	);
};
},{"./parse-value":16,"./rect":18}],9:[function(require,module,exports){
/**
 * Get or set element’s style, prefix-agnostic.
 *
 * @module  mucss/css
 */
var fakeStyle = require('./fake-element').style;
var prefix = require('./prefix').lowercase;


/**
 * Apply styles to an element.
 *
 * @param    {Element}   el   An element to apply styles.
 * @param    {Object|string}   obj   Set of style rules or string to get style rule.
 */
module.exports = function(el, obj){
	if (!el || !obj) return;

	var name, value;

	//return value, if string passed
	if (typeof obj === 'string') {
		name = obj;

		//return value, if no value passed
		if (arguments.length < 3) {
			return el.style[prefixize(name)];
		}

		//set style, if value passed
		value = arguments[2] || '';
		obj = {};
		obj[name] = value;
	}

	for (name in obj){
		//convert numbers to px
		if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name)) obj[name] += 'px';

		value = obj[name] || '';

		el.style[prefixize(name)] = value;
	}
};


/**
 * Return prefixized prop name, if needed.
 *
 * @param    {string}   name   A property name.
 * @return   {string}   Prefixed property name.
 */
function prefixize(name){
	var uName = name[0].toUpperCase() + name.slice(1);
	if (fakeStyle[name] !== undefined) return name;
	if (fakeStyle[prefix + uName] !== undefined) return prefix + uName;
	return '';
}
},{"./fake-element":10,"./prefix":17}],10:[function(require,module,exports){
/** Just a fake element to test styles
 * @module mucss/fake-element
 */

module.exports = document.createElement('div');
},{}],11:[function(require,module,exports){
/**
 * Window scrollbar detector.
 *
 * @module mucss/has-scroll
 */

//TODO: detect any element scroll, not only the window
exports.x = function () {
	return window.innerHeight > document.documentElement.clientHeight;
};
exports.y = function () {
	return window.innerWidth > document.documentElement.clientWidth;
};
},{}],12:[function(require,module,exports){
/**
 * Detect whether element is placed to fixed container or is fixed itself.
 *
 * @module mucss/is-fixed
 *
 * @param {(Element|Object)} el Element to detect fixedness.
 *
 * @return {boolean} Whether element is nested.
 */
module.exports = function (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === window) return true;

	//unlike the doc
	if (el === document) return false;

	while (parentEl) {
		if (getComputedStyle(parentEl).position === 'fixed') return true;
		parentEl = parentEl.offsetParent;
	}
	return false;
};
},{}],13:[function(require,module,exports){
/**
 * Get margins of an element.
 * @module mucss/margins
 */

var parse = require('./parse-value');
var Rect = require('./rect');

/**
 * Return margins of an element.
 *
 * @param    {Element}   el   An element which to calc margins.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.marginLeft),
		parse(style.marginTop),
		parse(style.marginRight),
		parse(style.marginBottom)
	);
};
},{"./parse-value":16,"./rect":18}],14:[function(require,module,exports){
/**
 * Calculate absolute offsets of an element, relative to the document.
 *
 * @module mucss/offsets
 *
 */
var win = window;
var doc = document;
var Rect = require('./rect');
var hasScroll = require('./has-scroll');
var scrollbar = require('./scrollbar');
var isFixedEl = require('./is-fixed');
var getTranslate = require('./translate');


/**
 * Return absolute offsets of any target passed
 *
 * @param    {Element|window}   el   A target. Pass window to calculate viewport offsets
 * @return   {Object}   Offsets object with trbl.
 */
module.exports = offsets;

function offsets (el) {
	if (!el) throw Error('Bad argument');

	//calc client rect
	var cRect, result;

	//return vp offsets
	if (el === win) {
		result = Rect(
			win.pageXOffset,
			win.pageYOffset
		);

		result.width = win.innerWidth - (hasScroll.y() ? scrollbar : 0),
		result.height = win.innerHeight - (hasScroll.x() ? scrollbar : 0)
		result.right = result.left + result.width;
		result.bottom = result.top + result.height;

		return result;
	}

	//return absolute offsets if document requested
	else if (el === doc) {
		var res = offsets(doc.documentElement);
		res.bottom = Math.max(window.innerHeight, res.bottom);
		res.right = Math.max(window.innerWidth, res.right);
		if (hasScroll.y(doc.documentElement)) res.right -= scrollbar;
		if (hasScroll.x(doc.documentElement)) res.bottom -= scrollbar;
		return res;
	}

	//FIXME: why not every element has getBoundingClientRect method?
	try {
		cRect = el.getBoundingClientRect();
	} catch (e) {
		cRect = Rect(
			el.clientLeft,
			el.clientTop
		);
	}

	//whether element is or is in fixed
	var isFixed = isFixedEl(el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;

	result = Rect(
		cRect.left + xOffset,
		cRect.top + yOffset,
		cRect.left + xOffset + el.offsetWidth,
		cRect.top + yOffset + el.offsetHeight
	);

	return result;
};
},{"./has-scroll":11,"./is-fixed":12,"./rect":18,"./scrollbar":19,"./translate":20}],15:[function(require,module,exports){
/**
 * Caclulate paddings of an element.
 * @module  mucss/paddings
 */


var Rect = require('./rect');
var parse = require('./parse-value');


/**
 * Return paddings of an element.
 *
 * @param    {Element}   el   An element to calc paddings.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.paddingLeft),
		parse(style.paddingTop),
		parse(style.paddingRight),
		parse(style.paddingBottom)
	);
};
},{"./parse-value":16,"./rect":18}],16:[function(require,module,exports){
/**
 * Returns parsed css value.
 *
 * @module mucss/parse-value
 *
 * @param {string} str A string containing css units value
 *
 * @return {number} Parsed number value
 */
module.exports = function (str){
	str += '';
	return parseFloat(str.slice(0,-2)) || 0;
};

//FIXME: add parsing units
},{}],17:[function(require,module,exports){
/**
 * Vendor prefixes
 * Method of http://davidwalsh.name/vendor-prefix
 * @module mucss/prefix
 */

var styles = getComputedStyle(document.documentElement, '');

if (!styles) {
	module.exports = {
		dom: '', lowercase: '', css: '', js: ''
	};
}

else {
	var pre = (Array.prototype.slice.call(styles)
		.join('')
		.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
	)[1];

	var dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

	module.exports = {
		dom: dom,
		lowercase: pre,
		css: '-' + pre + '-',
		js: pre[0].toUpperCase() + pre.substr(1)
	};
}
},{}],18:[function(require,module,exports){
/**
 * Simple rect constructor.
 * It is just faster and smaller than constructing an object.
 *
 * @module mucss/rect
 *
 * @param {number} l left
 * @param {number} t top
 * @param {number} r right
 * @param {number} b bottom
 *
 * @return {Rect} A rectangle object
 */
module.exports = function Rect (l,t,r,b) {
	if (!(this instanceof Rect)) return new Rect(l,t,r,b);

	this.left=l||0;
	this.top=t||0;
	this.right=r||0;
	this.bottom=b||0;
	this.width=Math.abs(this.right - this.left);
	this.height=Math.abs(this.bottom - this.top);
};
},{}],19:[function(require,module,exports){
/**
 * Calculate scrollbar width.
 *
 * @module mucss/scrollbar
 */

// Create the measurement node
var scrollDiv = document.createElement("div");

var style = scrollDiv.style;

style.width = '100px';
style.height = '100px';
style.overflow = 'scroll';
style.position = 'absolute';
style.top = '-9999px';

document.documentElement.appendChild(scrollDiv);

// the scrollbar width
module.exports = scrollDiv.offsetWidth - scrollDiv.clientWidth;

// Delete fake DIV
document.documentElement.removeChild(scrollDiv);
},{}],20:[function(require,module,exports){
/**
 * Parse translate3d
 *
 * @module mucss/translate
 */

var css = require('./css');
var parseValue = require('./parse-value');

module.exports = function (el) {
	var translateStr = css(el, 'transform');

	//find translate token, retrieve comma-enclosed values
	//translate3d(1px, 2px, 2) → 1px, 2px, 2
	//FIXME: handle nested calcs
	var match = /translate(?:3d)?\s*\(([^\)]*)\)/.exec(translateStr);

	if (!match) return [0, 0];
	var values = match[1].split(/\s*,\s*/);

	//parse values
	//FIXME: nested values are not necessarily pixels
	return values.map(function (value) {
		return parseValue(value);
	});
};
},{"./css":9,"./parse-value":16}],21:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'boolean' || a instanceof Boolean;
}
},{}],22:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'number' || a instanceof Number;
}
},{}],23:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(o){
	// return obj === Object(obj);
	return !!o && typeof o === 'object' && o.constructor === Object;
};
},{}],24:[function(require,module,exports){
var isString = require('./is-string'),
	isNumber = require('./is-number'),
	isBool = require('./is-bool');

module.exports = function isPlain(a){
	return !a || isString(a) || isNumber(a) || isBool(a);
};
},{"./is-bool":21,"./is-number":22,"./is-string":25}],25:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],26:[function(require,module,exports){
/**
* @module  placer
*
* Places any element relative to any other element the way you define
*/

//TODO: use translate3d instead of absolute repositioning (option?)
//TODO: implement avoiding strategy (graphic editors use-case when you need to avoid placing over selected elements)
//TODO: enhance best-side strategy: choose the most closest side

var css = require('mucss/css');
var scrollbarWidth = require('mucss/scrollbar');
var isFixed = require('mucss/is-fixed');
var offsets = require('mucss/offset');
var hasScroll = require('mucss/has-scroll');
var borders = require('mucss/border');
var margins = require('mucss/margin');
var softExtend = require('soft-extend');
var align = require('aligner');
var parseValue = require('mucss/parse-value');

//shortcuts
var win = window, doc = document, root = doc.documentElement;


module.exports = place;

place.align = align;
place.toFloat = align.toFloat;

/**
 * Default options
 */
var defaults = {
	//an element to align relatively to
	//element
	target: win,

	//which side to place element
	//t/r/b/l, 'center', 'middle'
	side: 'auto',

	/**
	 * An alignment trbl/0..1/center
	 *
	 * @default  0
	 * @type {(number|string|array)}
	 */
	align: 0.5,

	//selector/nodelist/node/[x,y]/window/function(el)
	avoid: undefined,

	//selector/nodelist/node/[x,y]/window/function(el)
	within: window,

	//look for better blacement, if doesn’t fit
	auto: true
};


/**
 * Place element relative to the target by the side & params passed.
 *
 * @main
 *
 * @param {Element} element An element to place
 * @param {object} options Options object
 *
 * @return {boolean} The result of placement - whether placing succeeded
 */
function place (element, options) {
	//inherit defaults
	options = softExtend(options, defaults);

	options.target = options.target || options.to || win;

	if (!options.within) {
		options.within = options.target === win ? win : root;
	}

	//TODO: query avoidables
	// options.avoid = q(element, options.avoid, true);


	//set the same position as the target or absolute
	var elStyle = getComputedStyle(element);
	if (elStyle.position === 'static') {
		if (options.target instanceof Element && isFixed(options.target)) {
			element.style.position = 'fixed';
		}
		else {
			element.style.position = 'absolute';
		}
	}

	//force placing into DOM
	if (!document.contains(element)) (document.body || document.documentElement).appendChild(element);


	//else place according to the position
	var side = (options.auto || options.side === 'auto') ? getBestSide(element, options) : options.side;
	placeBySide[side](element, options);


	return element;
}


/**
 * Set of positioning functions
 * @enum {Function}
 * @param {Element} placee Element to place
 * @param {object} target Offsets rectangle (absolute position)
 * @param {object} ignore Sides to avoid entering (usually, already tried)
 */
var placeBySide = {
	center: function(placee, opts){
		//get to & within rectangles
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//align centered
		var al = opts.align;
		if (!(al instanceof Array)) {
			if (/,/.test(al)) {
				al = al.split(/\s*,\s*/);
				al = [parseFloat(al[0]), parseFloat(al[1])];
			}
			else if (/top|bottom|middle/.test(al)) al = [.5, al];
			else al = [al, .5];
		}

		align([opts.target, placee], al);

		//apply limits
		//FIXME: understand this use-case when it should be called for centered view
		if (opts.within && opts.within !== window) {
			trimPositionY(placee, opts, parentRect);
			trimPositionX(placee, opts, parentRect);
		}


		//upd options
		opts.side = 'center';
	},

	left: function(placee, opts){
		var parent = placee.offsetParent || document.body || root;

		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(parent);

		//correct borders
		contractRect(parentRect, borders(parent));


		//place left (set css right because placee width may change)
		css(placee, {
			right: parentRect.right - placerRect.left,
			left: 'auto'
		});

		//place vertically properly
		align([opts.target, placee], [null, opts.align]);


		//apply limits
		if (opts.within) trimPositionY(placee, opts, parentRect);


		//upd options
		opts.side = 'left';
	},

	right: function (placee, opts) {
		//get to & within rectangles
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//correct borders
		contractRect(parentRect, borders(placee.offsetParent));


		//place right
		css(placee, {
			left: placerRect.right - parentRect.left,
			right: 'auto',
		});


		//place vertically properly
		align([opts.target, placee], [null, opts.align]);


		//apply limits
		if (opts.within) trimPositionY(placee, opts, parentRect);


		//upd options
		opts.side = 'right';
	},

	top: function(placee, opts){
		var parent = placee.offsetParent || document.body || root;
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);

		//correct borders
		contractRect(parentRect, borders(parent));


		//place vertically top-side
		css(placee, {
			bottom: parentRect.bottom - placerRect.top,
			top: 'auto'
		});


		//place horizontally properly
		align([opts.target, placee], [opts.align]);


		//apply limits
		if (opts.within) trimPositionX(placee, opts, parentRect);


		//upd options
		opts.side = 'top';
	},

	bottom: function(placee, opts){
		//get to & within rectangles
		var placerRect = offsets(opts.target);
		var parentRect = getParentRect(placee.offsetParent);


		//correct borders
		contractRect(parentRect, borders(placee.offsetParent));


		//place bottom
		css(placee, {
			top: placerRect.bottom - parentRect.top,
			bottom: 'auto',
		});


		//place horizontally properly
		align([opts.target, placee], [opts.align]);


		//apply limits
		if (opts.within) trimPositionX(placee, opts, parentRect);


		//upd options
		opts.side = 'bottom';
	}
};


/**
 * Find the most appropriate side to place element
 */
function getBestSide (placee, opts) {
	var initSide = opts.side === 'auto' ? 'bottom' : opts.side;

	var withinRect = offsets(opts.within),
		placeeRect = offsets(placee),
		placerRect = offsets(opts.target);

	contractRect(withinRect, borders(opts.within));

	var placeeMargins = margins(placee);

	//rect of "hot" area (available spaces from placer to container)
	var hotRect = {
		top: placerRect.top - withinRect.top,
		bottom: withinRect.bottom - placerRect.bottom,
		left: placerRect.left - withinRect.left,
		right: withinRect.right - placerRect.right
	};

	//rect of available spaces
	var availSpace = {
		top: hotRect.top - placeeRect.height - placeeMargins.top - placeeMargins.bottom,
		bottom: hotRect.bottom - placeeRect.height - placeeMargins.top - placeeMargins.bottom,
		left: hotRect.left - placeeRect.width - placeeMargins.left - placeeMargins.right,
		right: hotRect.right - placeeRect.width - placeeMargins.left - placeeMargins.right
	};

	//TODO: if avoidable el is within the hot area - specify the side limits


	//if fits initial side, return it
	if (availSpace[initSide] >= 0) return initSide;

	//if none of sides fit, return center
	if (availSpace.top < 0 && availSpace.bottom < 0 && availSpace.left < 0 && availSpace.right < 0) return 'center';

	//else find the most free side within others
	var maxSide = initSide, maxSpace = availSpace[maxSide];
	for (var side in availSpace) {
		if (availSpace[side] > maxSpace) {
			maxSide = side; maxSpace = availSpace[maxSide];
		}
	}

	return maxSide;
}



/** contract rect 1 with rect 2 */
function contractRect(rect, rect2){
	//correct rect2
	rect.left += rect2.left;
	rect.right -= rect2.right;
	rect.bottom -= rect2.bottom;
	rect.top += rect2.top;
	return rect;
}


/** Apply limits rectangle to the position of an element */
function trimPositionY(placee, opts, parentRect){
	var within = opts.within;

	var placeeRect = offsets(placee);
	var withinRect = offsets(within);
	var placeeMargins = margins(placee);

	if (within === window && isFixed(placee)) {
		withinRect.top = 0;
		withinRect.left = 0;
	}

	contractRect(withinRect, borders(within));

	//shorten withinRect by the avoidable elements
	//within the set of avoidable elements find the ones
	if (opts.avoid) {

	}

	if (withinRect.top > placeeRect.top - placeeMargins.top) {
		css(placee, {
			top: withinRect.top - parentRect.top,
			bottom: 'auto'
		});
	}

	else if (withinRect.bottom < placeeRect.bottom + placeeMargins.bottom) {
		css(placee, {
			top: 'auto',
			bottom: parentRect.bottom - withinRect.bottom
		});
	}
}
function trimPositionX(placee, opts, parentRect){
	var within = opts.within;

	var placeeRect = offsets(placee);
	var withinRect = offsets(within);
	var placeeMargins = margins(placee);

	if (within === window && isFixed(placee)) {
		withinRect.top = 0;
		withinRect.left = 0;
	}

	contractRect(withinRect, borders(within));

	if (withinRect.left > placeeRect.left - placeeMargins.left) {
		css(placee, {
			left: withinRect.left - parentRect.left,
			right: 'auto'
		});
	}

	else if (withinRect.right < placeeRect.right + placeeMargins.right) {
		css(placee, {
			left: 'auto',
			right: parentRect.right - withinRect.right
		});
	}
}


/**
 * Return offsets rectangle for an element/array/any target passed.
 * I. e. normalize offsets rect
 *
 * @param {*} el Element, selector, window, document, rect, array
 *
 * @return {object} Offsets rectangle
 */
function getParentRect (target) {
	var rect;

	//handle special static body case
	if (target == null || target === window || (target === doc.body && getComputedStyle(target).position === 'static') || target === root) {
		rect = {
			left: 0,
			right: win.innerWidth - (hasScroll.y() ? scrollbarWidth : 0),
			width: win.innerWidth,
			top: 0,
			bottom: win.innerHeight - (hasScroll.x() ? scrollbarWidth : 0),
			height: win.innerHeight
		};
	}
	else {
		rect = offsets(target);
	}

	return rect;
}
},{"aligner":3,"mucss/border":8,"mucss/css":9,"mucss/has-scroll":11,"mucss/is-fixed":12,"mucss/margin":13,"mucss/offset":14,"mucss/parse-value":16,"mucss/scrollbar":19,"soft-extend":29}],27:[function(require,module,exports){
/**
 * @module  popup
 */

var Emitter = require('events');
var place = require('placer');
var extend = require('xtend/mutable');
var uid = require('get-uid');
var inherits = require('inherits');
var createOverlay = require('./overlay');
var insertCss = require('insert-css');

var sb = require('mucss/scrollbar')

insertCss(".prama {\r\n\tfont-family: sans-serif;\r\n}\r\n\r\n.prama hidden {\r\n\tdisplay: none!important;\r\n}\r\n\r\n.prama * {\r\n\tbox-sizing: border-box;\r\n}\r\n\r\n.prama-title {\r\n\ttext-align: center;\r\n}\r\n\r\n.prama-param {\r\n\tmargin-bottom: 1rem;\r\n\tposition: relative;\r\n}\r\n\r\n.prama-label {\r\n\tfont-size: .95rem;\r\n\tdisplay: inline-block;\r\n\twidth: 20%;\r\n\tvertical-align: top;\r\n\tline-height: 1.6rem;\r\n\tpadding-top: .2em;\r\n\theight: 2rem;\r\n}\r\n\r\n.prama-label + * {\r\n\tmax-width: 60%;\r\n\tdisplay: inline-block;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama-label {\r\n\t\tdisplay: block;\r\n\t\twidth: 100%;\r\n\t}\r\n\t.prama-label + * {\r\n\t\tmax-width: none;\r\n\t}\r\n\t.prama-label:empty {\r\n\t\tdisplay: none;\r\n\t}\r\n}\r\n\r\n.prama-input {\r\n\tfont-size: 1rem;\r\n}\r\n\r\n.prama-help {\r\n\tword-break: break-word;\r\n\tdisplay: inline-block;\r\n\tvertical-align: top;\r\n\twidth: 18%;\r\n\tmargin-left: 1%;\r\n\tpadding-top: .5rem;\r\n\tline-height: 1.2rem;\r\n\tfont-size: .9rem;\r\n\tcolor: #888;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama-help {\r\n\t\tdisplay: block;\r\n\t\twidth: 100%;\r\n\t}\r\n}\r\n\r\n.prama textarea,\r\n.prama input:not([type]),\r\n.prama input[type=\"text\"],\r\n.prama input[type=\"number\"],\r\n.prama input[type=\"range\"],\r\n.prama input[type=\"submit\"],\r\n.prama input[type=\"reset\"],\r\n.prama select,\r\n.prama button,\r\n.prama fieldset {\r\n\t-webkit-appearance: none;\r\n\t-moz-appearance: none;\r\n\tappearance: none;\r\n\tvertical-align: top;\r\n\tdisplay: inline-block;\r\n\t/*line-height: 2rem;*/\r\n\tmin-height: 2rem;\r\n\tmin-width: 2rem;\r\n\tborder: none;\r\n\tmargin: 0;\r\n\tborder-radius: .2222rem;\r\n}\r\n\r\n.prama textarea,\r\n.prama input:not([type]),\r\n.prama input[type=\"text\"],\r\n.prama input[type=\"number\"],\r\n.prama select {\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tbackground: rgb(241, 244, 249);\r\n\twidth: 60%;\r\n\tpadding: .2rem .5rem;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama textarea,\r\n\t.prama input:not([type]),\r\n\t.prama input[type=\"text\"],\r\n\t.prama input[type=\"number\"],\r\n\t.prama select {\r\n\t\twidth: 100%;\r\n\t}\r\n}\r\n\r\n.prama-input:not([type=\"range\"]):focus {\r\n\tbox-shadow: 0 0 0 2px rgb(2, 135, 210);\r\n\toutline: none;\r\n}\r\n\r\n.prama textarea {\r\n\tvertical-align: top;\r\n\tpadding-top: .5rem;\r\n\tline-height: 1.5;\r\n}\r\n\r\n.prama input[type=\"checkbox\"],\r\n.prama input[type=\"radio\"] {\r\n\tmargin: 0;\r\n\tcursor: pointer;\r\n\tbackground: rgb(2, 135, 210);\r\n\tborder-color: rgb(2, 98, 157);\r\n\tfont-weight: bolder;\r\n\tfont-size: 1.4rem;\r\n\tline-height: 1.6rem;\r\n\twidth: 1.6rem;\r\n\theight: 1.6rem;\r\n\tvertical-align: top;\r\n\ttext-align: center;\r\n}\r\n.prama input[type=\"radio\"] {\r\n\tborder-radius: 2rem;\r\n}\r\n\r\n.prama fieldset {\r\n\tpadding: 0;\r\n\theight: auto;\r\n\tbackground: none;\r\n\tvertical-align: top;\r\n\tborder: none;\r\n\twidth: 60%;\r\n\tline-height: 2.4rem;\r\n}\r\n.prama fieldset label {\r\n\twidth: auto;\r\n\tcursor: pointer;\r\n\tline-height: 2rem;\r\n\theight: 2rem;\r\n\tdisplay: inline-block;\r\n\tmargin-right: 1rem;\r\n\tmin-width: 45%;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama fieldset {\r\n\t\twidth: 100%;\r\n\t\tdisplay: block;\r\n\t}\r\n}\r\n\r\n.prama button,\r\n.prama input[type=\"submit\"],\r\n.prama input[type=\"reset\"] {\r\n\tbackground: rgb(2, 135, 210);\r\n\tcolor: white;\r\n\theight: 2.4rem;\r\n\tline-height: 2.4rem;\r\n\tpadding: 0 1rem;\r\n\twidth: 20%;\r\n\tfont-weight: bold;\r\n\tcursor: pointer;\r\n}\r\n\r\n.prama button:active,\r\n.prama input[type=\"submit\"]:active,\r\n.prama input[type=\"reset\"]:active {\r\n\tbackground: rgb(241, 244, 249);\r\n\tcolor: rgb(2, 135, 210);\r\n}\r\n\r\n\r\n/* Hide default HTML checkbox */\r\n.prama-toggle {\r\n  position: relative;\r\n  display: inline-block;\r\n  vertical-align: top;\r\n  width: 4rem;\r\n  height: 2rem;\r\n}\r\n.prama-toggle input {\r\n\tdisplay: none;\r\n}\r\n.prama-toggle .prama-toggle-thumb {\r\n\tposition: absolute;\r\n\tcursor: pointer;\r\n\ttop: 0;\r\n\tleft: 0;\r\n\tright: 0;\r\n\tbottom: 0;\r\n\tbackground-color: rgb(241, 244, 249);\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tborder-radius: 34px;\r\n\t-webkit-transition: .4s;\r\n\ttransition: .4s;\r\n}\r\n.prama-toggle .prama-toggle-thumb:before {\r\n\tposition: absolute;\r\n\tborder-radius: 34px;\r\n\tcontent: \"\";\r\n\theight: 1.6rem;\r\n\twidth: 1.6rem;\r\n\tleft: .2rem;\r\n\tbottom: .2rem;\r\n\tbackground-color: white;\r\n\tbox-shadow: 0 1px 2px 1px rgb(231, 234, 249);\r\n\t-webkit-transition: .4s;\r\n\ttransition: .4s;\r\n}\r\n.prama-toggle input:checked + .prama-toggle-thumb {\r\n\tbackground-color: rgb(2, 135, 210);\r\n\tbox-shadow: none;\r\n}\r\n.prama-toggle input:focus + .prama-toggle-thumb {\r\n\tbox-shadow: 0 0 1px rgb(2, 135, 210);\r\n}\r\n.prama-toggle input:checked + .prama-toggle-thumb:before {\r\n\t-webkit-transform: translateX(2rem);\r\n\t-ms-transform: translateX(2rem);\r\n\ttransform: translateX(2rem);\r\n\tbox-shadow: none;\r\n\tbackground-color: white;\r\n}\r\n\r\n\r\n.prama input[type=\"range\"] {\r\n\twidth: 29%;\r\n\tmargin-right: 1%;\r\n\t-webkit-appearance: none;\r\n\t-moz-appearance: none;\r\n\tappearance: none;\r\n\t/** O_o you can’t use height for IE here */\r\n\tpadding: 0;\r\n\tmargin-top: .5rem;\r\n\tmin-height: .5rem;\r\n}\r\n.prama input[type=\"range\"] ~ input:not(.ghost) {\r\n\twidth: 20%;\r\n\tpadding-right: 0;\r\n}\r\n\r\n@media (max-width: 42rem) {\r\n\t.prama input[type=\"range\"] {\r\n\t\twidth: 79%;\r\n\t}\r\n}\r\n\r\n.prama input[type=\"range\"]:focus {\r\n\toutline: none;\r\n}\r\n.prama input[type=\"range\"]::-webkit-slider-runnable-track {\r\n\theight: .5rem;\r\n\tcursor: pointer;\r\n\tbox-shadow: none;\r\n\tbackground: rgb(241, 244, 249);\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tborder-radius: .5rem;\r\n\tborder: none;\r\n\tmargin: .25rem 0 .25rem;\r\n}\r\n.prama input[type=\"range\"]::-webkit-slider-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\theight: 2rem;\r\n\twidth: 2rem;\r\n\tborder-radius: 2rem;\r\n\tbackground: rgb(2, 135, 210);\r\n\tcursor: pointer;\r\n\tmargin-top: -.75rem;\r\n\t-webkit-appearance: none;\r\n}\r\n.prama input[type=\"range\"]:focus::-webkit-slider-runnable-track {\r\n\tbackground: rgb(241, 244, 249);\r\n}\r\n.prama input[type=\"range\"]::-moz-range-track {\r\n\theight: .5rem;\r\n\tcursor: pointer;\r\n\tbox-shadow: none;\r\n\tbackground: rgb(241, 244, 249);\r\n\tborder-radius: .5rem;\r\n\tborder: none;\r\n}\r\n.prama input[type=\"range\"]::-moz-range-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\theight: 2rem;\r\n\twidth: 2rem;\r\n\tborder-radius: 2rem;\r\n\tbackground: rgb(2, 135, 210);\r\n\tcursor: pointer;\r\n}\r\ninput[type=\"range\"]::-ms-track {\r\n\theight: .5rem;\r\n\tbox-shadow: inset 0 1px 2px 1px rgb(231, 234, 249);\r\n\tcursor: pointer;\r\n\tbackground: transparent;\r\n\tborder-color: transparent;\r\n\tcolor: transparent;\r\n}\r\n\r\ninput[type=\"range\"]::-ms-fill-lower {\r\n\tbackground: rgb(241, 244, 249);\r\n\tborder: none;\r\n\tborder-radius: 26px;\r\n\tbox-shadow: none;\r\n}\r\ninput[type=\"range\"]::-ms-fill-upper {\r\n\tbackground: rgb(241, 244, 249);\r\n\tborder: none;\r\n\tborder-radius: 26px;\r\n\tbox-shadow: none;\r\n}\r\ninput[type=\"range\"]::-ms-thumb {\r\n\tbox-shadow: none;\r\n\tborder: none;\r\n\twidth: 2rem;\r\n\tborder-radius: 2rem;\r\n\tbackground: rgb(2, 135, 210);\r\n\tcursor: pointer;\r\n\theight: .5rem;\r\n}\r\ninput[type=\"range\"]:focus::-ms-fill-lower {\r\n\tbackground: rgb(241, 244, 249);\r\n}\r\ninput[type=\"range\"]:focus::-ms-fill-upper {\r\n\tbackground: rgb(241, 244, 249);\r\n}\r\n\r\n\r\n\r\n\r\n/** multirange polyfill */\r\n@supports (--css: variables) {\r\n\tinput[type=\"range\"].multirange {\r\n\t\tdisplay: inline-block;\r\n\t\tvertical-align: top;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original {\r\n\t\tposition: absolute;\r\n\t\ttop: 0;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original::-webkit-slider-thumb {\r\n\t\tposition: relative;\r\n\t\tz-index: 2;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.original::-moz-range-thumb {\r\n\t\ttransform: scale(1); /* FF doesn't apply position it seems */\r\n\t\tz-index: 1;\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange::-moz-range-track {\r\n\t\tborder-color: transparent; /* needed to switch FF to \"styleable\" control */\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost {\r\n\t\tposition: relative;\r\n\t\tbackground: var(--track-background);\r\n\t\t--track-background: linear-gradient(to right,\r\n\t\t\t\ttransparent var(--low), var(--range-color) 0,\r\n\t\t\t\tvar(--range-color) var(--high), transparent 0\r\n\t\t\t) no-repeat 0 45% / 100% 40%;\r\n\t\t--range-color: rgb(2, 135, 210);\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost::-webkit-slider-runnable-track {\r\n\t\tbackground: var(--track-background);\r\n\t}\r\n\r\n\tinput[type=\"range\"].multirange.ghost::-moz-range-track {\r\n\t\tbackground: var(--track-background);\r\n\t}\r\n}\r\n\r\n\r\n\r\n\r\n.prama ::-webkit-input-placeholder { /* Chrome/Opera/Safari */\r\n\tcolor: #bbc;\r\n}\r\n.prama ::-moz-placeholder { /* Firefox 19+ */\r\n\tcolor: #bbc;\r\n}\r\n.prama :-ms-input-placeholder { /* IE 10+ */\r\n\tcolor: #bbc;\r\n}\r\n.prama :-moz-placeholder { /* Firefox 18- */\r\n\tcolor: #bbc;\r\n}");

module.exports = Popup;


/**
 * @class  Popup
 *
 * @constructor
 *
 * @param {Object} options Showing options
 *
 * @return {Popup} A popup controller
 */
function Popup (opts) {
	var this$1 = this;

	if (!(this instanceof Popup)) return new Popup(opts);

	var typeOpts = this.types[opts.type || this.type] || {};

	//hook up type events and options events
	if (typeOpts.onInit) this.on('init', typeOpts.onInit);
	if (typeOpts.onShow) this.on('show', typeOpts.onShow);
	if (typeOpts.onHide) this.on('hide', typeOpts.onHide);
	if (typeOpts.onAfterShow) this.on('afterShow', typeOpts.onAfterShow);
	if (typeOpts.onAfterHide) this.on('afterHide', typeOpts.onAfterHide);
	if (opts.onInit) this.on('init', opts.onInit);
	if (opts.onShow) this.on('show', opts.onShow);
	if (opts.onHide) this.on('hide', opts.onHide);
	if (opts.onAfterShow) this.on('afterShow', opts.onAfterShow);
	if (opts.onAfterHide) this.on('afterHide', opts.onAfterHide);


	//generate unique id
	this.id = uid();

	//FIXME: :'(
	this.update = this.update.bind(this);

	//ensure element
	if (!this.element) this.element = document.createElement('div');
	this.element.classList.add('popoff-popup');
	this.element.classList.add('popoff-hidden');

	//take over type’s options.
	//should be after element creation to init `content` property
	extend(this, typeOpts, opts);

	this.element.classList.add(("popoff-" + (this.type)));

	//take over a target first
	if (!this.container) {
		this.container = document.body || document.documentElement;
	}
	this.container.classList.add('popoff-container');

	//create close element
	this.closeElement = document.createElement('div');
	this.closeElement.classList.add('popoff-close');
	if (this.closable) {
		this.closeElement.addEventListener('click', function (e) {
			this$1.hide();
		});
		this.element.appendChild(this.closeElement);
	}

	//create tip
	this.tipElement = document.createElement('div');
	this.tipElement.classList.add('popoff-tip');
	this.tipElement.classList.add('popoff-hidden');
	if (this.tip) {
		this.container.appendChild(this.tipElement);
		this.element.classList.add('popoff-popup-tip');
	}

	//apply custom style
	if (this.style) {
		for (var name in this.style) {
			var value = this$1.style[name];
			if (typeof value === 'number' && !/z/.test(name)) value += 'px';
			this$1.element.style[name] = value;
		}
	}

	//create overflow for tall content
	this.overflowElement = document.createElement('div');
	this.overflowElement.classList.add('popoff-overflow');

	this.container.appendChild(this.element);

	if (this.escapable) {
		document.addEventListener('keyup', function (e) {
			if (!this$1.isVisible) return;
			if (e.which === 27) {
				this$1.hide();
			}
		});
	}

	//init proper target
	if (typeof this.target === 'string') {
		this.target = document.querySelector(this.target);
	}

	//update on resize
	window.addEventListener('resize', function () {
		this$1.update();
	});

	this.emit('init');
}

inherits(Popup, Emitter);

extend(Popup.prototype, {
	/** Show overlay, will be detected based off type */
	overlay: true,

	/** Show close button */
	closable: true,

	/** Close by escape */
	escapable: true,

	/** Show tip */
	tip: false,

	/** Place popup relative to the element, like dropdown */
	target: window,

	/** Whether to show only one popup */
	single: true,

	/** A target to bind default placing */
	container: document.body || document.documentElement,

	/** Animation effect, can be a list */
	effect: 'fade',

	/** Default module type to take over the options */
	type: 'modal',

	/** Placing settings */
	side: 'center',
	align: 'center',

	//default anim fallback
	animTimeout: 1000,

	//detect tall content
	wrap: false,

	//shift content
	shift: true
});

//FIXME: hope it will not crash safari
Object.defineProperties(Popup.prototype, {
	content: {
		get: function () {
			return this.element;
		},
		set: function (content) {
			if (!this.element) throw Error('Content element is undefined');

			if (this.closeElement) this.element.removeChild(this.closeElement);

			if (content instanceof HTMLElement) {
				this.element.innerHTML = '';
				this.element.appendChild(content);
			}
			else if (typeof content === 'string') {
				this.element.innerHTML = content;
			}

			if (this.closeElement) this.element.appendChild(this.closeElement);
		}
	}
});


/** Type of default interactions */
Popup.prototype.types = {
	modal: {
		overlay: true,
		closable: true,
		escapable: true,
		tip: false,
		single: true,
		side: 'center',
		align: 'center',
		target: null,
		wrap: true,
		effect: 'fade',
		update: function () {},
		onInit: function () {
			var this$1 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return;

					return this$1.show();
				});
			}
			else {
				this.target = window;
			}
		}
	},

	dropdown: {
		overlay: false,
		closable: false,
		escapable: true,
		target: null,
		tip: true,
		single: true,
		side: 'bottom',
		align: 'center',
		effect: 'fade',
		onInit: function () {
			var this$1 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return this$1.hide();
					else return this$1.show();
				});
			}

			//hide on unfocus
			document.addEventListener('click', function (e) {
				if (!this$1.isVisible) {
					return;
				}

				//ignore contain clicks
				if (this$1.element.contains(e.target)) {
					return;
				}

				//ignore self clicks
				this$1.hide();
			});
		}
	},

	tooltip: {
		overlay: false,
		closable: false,
		escapable: true,
		target: null,
		tip: true,
		single: true,
		side: 'right',
		align: 'center',
		effect: 'fade',
		timeout: 500,
		onInit: function () {
			var this$1 = this;

			var that = this;

			if (this.target) {
				this.target.addEventListener('mouseenter', function (e) {
					if (this$1._leave) {
						clearTimeout(this$1._leave);
						this$1._leave = null;
					}
					if (this$1.isVisible) return;
					this$1.show();
					setTimeout(function () {
						this$1._leave = setTimeout(function () {
							this$1.hide();
						}, this$1.timeout + 1000);
					});
				});
				this.target.addEventListener('mousemove', function (e) {
					if (this$1._leave) {
						clearTimeout(this$1._leave);
						this$1._leave = null;
					}
				});
				this.target.addEventListener('mouseleave', function (e) {
					if (!this$1.isVisible) return;
					this$1._leave = setTimeout(function () {
						this$1.hide();
					}, this$1.timeout);
				});
			}

			this.element.addEventListener('mouseenter', function (e) {
				if (!this$1.isVisible) return;
				this$1._leave && clearTimeout(this$1._leave);
			});
			this.element.addEventListener('mouseleave', function (e) {
				if (!this$1.isVisible) return;
				this$1._leave = setTimeout(function () {
					this$1.hide();
				}, this$1.timeout);
			});
		}
	},

	sidebar: {
		overlay: false,
		closable: true,
		escapable: true,
		tip: false,
		single: true,
		side: 'bottom',
		align: .5,
		target: null,
		effect: 'slide',
		shift: true,
		update: function () {},
		onInit: function () {
			var this$1 = this;

			if (this.target) {
				this.target.addEventListener('click', function (e) {
					if (this$1.isVisible) return;

					return this$1.show();
				});
			}
			else {
				this.target = window;
			}
			this.container.parentNode.appendChild(this.element);
		},
		onShow: function () {
			if (!/top|left|bottom|right/.test(this.side)) this.side = this.types.sidebar.side;
			this.element.setAttribute('data-side', this.side);
			this.effect = 'slide-' + this.side;

			if (this.shift) {
				this.container.classList.add('popoff-animate');
				var value = typeof this.shift === 'number' ? (this.shift + 'px') : this.shift;
				if (/top|bottom/.test(this.side)) {
					this.container.style.transform = "translateY(" + ((this.side === 'top' ? '' : '-') + value) + ")";
				}
				else {
					this.container.style.transform = "translateX(" + ((this.side === 'left' ? '' : '-') + value) + ")";
				}
			}
		},
		onHide: function () {
			if (this.shift) this.container.style.transform = null;
		},
		onAfterHide: function () {
			this.shift && this.container.classList.remove('popoff-animate');
		}
	}
};


/**
 * Show popup near to the target
 */
Popup.prototype.show = function (target, cb) {
	var this$1 = this;

	if (this.isVisible) return this;

	if (target instanceof Function) {
		this.currentTarget = this.target;
		cb = target;
	}
	else {
		this.currentTarget = target || this.target;
	}

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.add('popoff-active');
	this.element.classList.remove('popoff-hidden');
	this.tipElement.classList.remove('popoff-hidden');

	this.emit('show', this.currentTarget);

	//ensure effects classes
	this.element.classList.add(("popoff-effect-" + (this.effect)));
	this.tipElement.classList.add(("popoff-effect-" + (this.effect)));

	var elHeight = this.element.offsetHeight;

	//apply overflow on body for tall content
	if (this.wrap) {
		if (elHeight > window.innerHeight) {
			this.isTall = true;
			this.overflowElement.classList.add('popoff-overflow-tall');
		}
		this.container.classList.add('popoff-container-overflow');
		this._border = this.container.style.borderRight;
		this.container.style.borderRight = sb + 'px solid transparent';
		this.container.appendChild(this.overflowElement);
		this.overflowElement.appendChild(this.element);
	}

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');

	//in some way it needs to be called in timeout with some delay, otherwise animation fails
	setTimeout(function () {
		this$1.element.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.tipElement.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.isVisible = true;
		this$1.update();
	}, 10);

	if (this.overlay) {
		this._overlay = createOverlay({
			closable: true,
			container: this.wrap ? this.overflowElement : this.container
		})
		.on('hide', function (e) {
			this$1._overlay = null;
			this$1.hide();
		})
		.show();
	}

	this.isAnimating = true;
	this.animend(function (e) {
		//in case if something happened with content during the animation
		// this.update();
		this$1.isAnimating = false;
		this$1.tipElement.classList.remove('popoff-animate');
		this$1.element.classList.remove('popoff-animate');
		this$1.element.classList.add('popoff-visible');
		this$1.tipElement.classList.add('popoff-visible');

		this$1.emit('afterShow');
		cb && cb.call(this$1);
	});

	return this;
}


/**
 * Hide popup
 */
Popup.prototype.hide = function (cb) {
	var this$1 = this;

	//overlay recurrently calls this.hide, so just drop it here
	if (this._overlay) return this._overlay.hide();

	this.currentTarget && this.currentTarget.classList && this.currentTarget.classList.remove('popoff-active');

	this.emit('hide');


	this.element.classList.add(("popoff-effect-" + (this.effect)));
	this.tipElement.classList.add(("popoff-effect-" + (this.effect)));

	this.isAnimating = true;

	this.tipElement.classList.add('popoff-animate');
	this.element.classList.add('popoff-animate');
	this.element.classList.remove('popoff-visible');
	this.tipElement.classList.remove('popoff-visible');


	this.animend(function () {
		this$1.isVisible = false;
		this$1.isAnimating = false;
		this$1._overlay = null;
		this$1.tipElement.classList.remove('popoff-animate');
		this$1.element.classList.remove('popoff-animate');
		this$1.element.classList.add('popoff-hidden');
		this$1.tipElement.classList.add('popoff-hidden');

		this$1.element.classList.remove(("popoff-effect-" + (this$1.effect)));
		this$1.tipElement.classList.remove(("popoff-effect-" + (this$1.effect)));

		if (this$1.wrap) {
			this$1.isTall = false;
			this$1.overflowElement.classList.remove('popoff-overflow-tall');
			this$1.container.classList.remove('popoff-container-overflow');
			this$1.container.style.borderRight = this$1._border || null;
			this$1._border = null;
			this$1.container.removeChild(this$1.overflowElement);
			this$1.container.appendChild(this$1.element);
		}

		this$1.emit('afterHide');
		cb && cb.call(this$1);
	});

	return this;
}


/** Place popup next to the target */
Popup.prototype.update = function (how) {
	if (!this.isVisible) return this;

	//wrapped modals are placed via css
	if (this.wrap) return this;

	how = extend({
		target: this.currentTarget || this.target,
		side: this.side,
		align: this.align,
		within: window
	}, how);

	this.emit('update', how);

	place(this.element, how);

	if (this.tip) {
		var side = 'top';
		switch (how.side) {
			case 'top':
				side = 'bottom';
				break;
			case 'bottom':
				side = 'top';
				break;
			case 'left':
				side = 'right';
				break;
			case 'right':
				side = 'left';
				break;
			default:
				side = 'center';
		}

		this.tipElement.setAttribute('data-side', side);
		place(this.tipElement, {
			target: this.element,
			side: side,
			align: 'center',
			within: null
		});
	}

	return this;
}


/** Trigger callback once on anim end */
Popup.prototype.animend = function (cb) {
	var this$1 = this;

	var to = setTimeout(function () {
		cb.call(this$1);
	}, this.animTimeout);

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);

	var that = this;
	function end () {
		clearTimeout(to);

		// that.element.removeEventListener('animationend', end);
		// that.element.removeEventListener('mozAnimationEnd', end);
		// that.element.removeEventListener('webkitAnimationEnd', end);
		// that.element.removeEventListener('oanimationend', end);
		// that.element.removeEventListener('MSAnimationEnd', end);
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);

		cb.call(that);
	}
}
},{"./overlay":28,"events":1,"get-uid":4,"inherits":5,"insert-css":6,"mucss/scrollbar":19,"placer":26,"xtend/mutable":30}],28:[function(require,module,exports){
/**
 * @module  popoff/overlay
 *
 * Because overlay-component is hopelessly out of date.
 * This is modern rewrite.
 */

var Emitter = require('events').EventEmitter;
var inherits = require('inherits');
var extend = require('xtend/mutable');


module.exports = Overlay;


/**
 * Initialize a new `Overlay`.
 *
 * @param {Object} options
 * @api public
 */

function Overlay(options) {
	var this$1 = this;

	if (!(this instanceof Overlay)) return new Overlay(options);

	Emitter.call(this);

	extend(this, options);

	if (!this.container) {
		this.container = document.body || document.documentElement;
	}

	//create overlay element
	this.element = document.createElement('div');
	this.element.classList.add('popoff-overlay');

	if (this.closable) {
		this.element.addEventListener('click', function (e) {
			this$1.hide();
		});
		this.element.classList.add('popoff-closable');
	}
}

inherits(Overlay, Emitter);


//close overlay by click
Overlay.prototype.closable = true;


/**
 * Show the overlay.
 *
 * Emits "show" event.
 *
 * @return {Overlay}
 * @api public
 */

Overlay.prototype.show = function () {
	var this$1 = this;

	this.emit('show');

	this.container.appendChild(this.element);

	//class removed in a timeout to save animation
	setTimeout( function () {
		this$1.element.classList.add('popoff-visible');
		this$1.emit('afterShow');
	}, 10);

	return this;
};


/**
 * Hide the overlay.
 *
 * Emits "hide" event.
 *
 * @return {Overlay}
 * @api public
 */

Overlay.prototype.hide = function () {
	this.emit('hide');

	this.element.classList.remove('popoff-visible');

	this.element.addEventListener('transitionend', end);
	this.element.addEventListener('webkitTransitionEnd', end);
	this.element.addEventListener('otransitionend', end);
	this.element.addEventListener('oTransitionEnd', end);
	this.element.addEventListener('msTransitionEnd', end);
	var to = setTimeout(end, 1000);

	var that = this;
	function end () {
		that.element.removeEventListener('transitionend', end);
		that.element.removeEventListener('webkitTransitionEnd', end);
		that.element.removeEventListener('otransitionend', end);
		that.element.removeEventListener('oTransitionEnd', end);
		that.element.removeEventListener('msTransitionEnd', end);
		clearInterval(to);

		that.container.removeChild(that.element);
		that.emit('afterHide');
	}

	return this;
};
},{"events":1,"inherits":5,"xtend/mutable":30}],29:[function(require,module,exports){
/**
 * Append all not-existing props to the initial object
 *
 * @return {[type]} [description]
 */
module.exports = function(){
	var args = [].slice.call(arguments);
	var res = args[0];
	var l = args.length;

	if (typeof res !== 'object') throw  Error('Bad argument');

	for (var i = 1, l = args.length, obj; i < l; i++) {
		obj = args[i];
		if (typeof obj === 'object') {
			for (var prop in obj) {
				if (res[prop] === undefined) res[prop] = obj[prop];
			}
		}
	}

	return res;
};
},{}],30:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    var arguments$1 = arguments;

    for (var i = 1; i < arguments.length; i++) {
        var source = arguments$1[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],31:[function(require,module,exports){
var extend = require('xtend/mutable');
var createParams = require('./');

var params = createParams({
	title: {
		label: '',
		create: "<header>\n\t\t\t<h1>Prama demo</h1>\n\t\t</header>",
		help: ''
	},

	name: {
		label: 'Field name',
		value: 'Field',
		placeholder: 'Field name...',
		change: function (value) {
			this.setParam('example', {
				label: value
			});
		}
	},
	type: {
		type: 'list',
		label: 'Type',
		values: ['text', 'number', 'multirange', 'textarea', 'toggle', 'select', 'switch', 'button'],
		value: 'text',
		change: function (value) {
			if (value === 'number' || value === 'range') {
				params.setParam('value', {
					type: 'number',
					value: 50
				});
			}
			else {
				params.setParam('value', {
					value: '',
					type: 'text',
					placeholder: 'value...'
				});
			}
			//show values list
			if (value === 'select' || value === 'switch') {
				params.setParam('values', {
					hidden: false
				});
			}
			else {
				params.setParam('values', {
					hidden: true
				});
			}
			params.setParam('example', {
				type: value
			});
		}
	},
	values: {
		label: 'Values',
		value: '',
		hidden: true,
		type: 'textarea',
		placeholder: 'option 1, option 2, option 3, ...',
		change: function (v) {
			var values = v.split(/\s*,\s*|\n/);
			params.setParam('example', {
				values: values
			});
		}
	},
	value: {
		label: 'Value',
		value: '',
		change: function (v) {
			params.setParam('example', v);
		}
	},
	help: {
		label: 'Help text',
		placeholder: 'Help text here...',
		type: 'textarea',
		change: function (v) {
			params.setParam('example', {help: v});
		}
	},
	//TODO: make dependent on multirange/range type
	// sampleRange: {
	// 	label: 'Range',
	// 	value: [11, 22]
	// },
	isHidden: {
		label: 'Hidden',
		value: false,
		change: function (value) { return params.setParam('example', {hidden: value}); }
	},
	// isDisabled: {
	// 	label: 'Disabled',
	// 	value: false,
	// 	change: value => params.setParam('example', {hidden: value})
	// },
	save: {
		label: '',
		type: 'button',
		value: 'Add field',
		style: {},
		change: function (v) {
			var p = extend({}, params.params.example);
			p.element = null;
			params.setParam('example-' + Object.keys(params.params).length, p);
			params.setParam('name', {
				value: ''
			});
		}
	},
	previewTitle: {
		create: function () {
			//return an html element with bound events
			return '<h3>Preview</h3>'
		}
	},
	example: {
		type: 'text',
		label: 'Field'
	},
	// divider: {
	// 	create: `<h3>Created fields</h3>`
	// }
}, {
	ui: false,
	history: false,
	load: false
});

document.body.appendChild(params.element);
},{"./":2,"xtend/mutable":30}]},{},[31]);
