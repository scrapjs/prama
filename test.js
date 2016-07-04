var extend = require('xtend/mutable');
var createParams = require('./');

var params = createParams({
	title: {
		label: '',
		create: `<header>
			<h1>Prama demo</h1>
		</header>`,
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
		change: (value) => {
			if (value === 'number' || value === 'range') {
				params.setParam('value', {
					type: 'number'
				});
			}
			else {
				params.setParam('value', {
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
		value: ['a', 'b', 'c'],
		hidden: true,
		type: 'textarea',
		placeholder: 'option 1, option 2, option 3, ...',
		change: (v) => {
			var values = Array.isArray(v) ? v : v.split(/\s*,\s*|\n/);
			params.setParam('example', {
				values: values
			});
		}
	},
	value: {
		label: 'Value',
		value: '',
		change: (v) => {
			params.setParam('example', v);
		}
	},
	help: {
		label: 'Help text',
		placeholder: 'Help text here...',
		type: 'textarea',
		change: (v) => {
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
		change: value => params.setParam('example', {hidden: value})
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
		change: (v) => {
			var p = extend({}, params.params.example);
			p.element = null;
			params.setParam('example-' + Object.keys(params.params).length, p);
			params.setParam('name', {
				value: ''
			});
		}
	},
	previewTitle: {
		create: () => {
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
	// ui: false,
	// history: false,
	// load: false
});


document.body.appendChild(params.element);