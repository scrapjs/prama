var extend = require('xtend/mutable');
var createParams = require('./');
var insertCSS = require('insert-css');

//prepare body
var meta = document.createElement('meta');
meta.setAttribute('name', 'viewport');
meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no');
document.head.appendChild(meta);

insertCSS(`
	body {
		margin: 0;
	}
	body > .prama {
		max-width: 900px;
		/* background: rgb(251, 250, 249); */
		border-radius: .5rem;
		padding: 1rem;
	}
	.prama-title {
		text-align: center;
		letter-spacing: -.05ex;
	}
`);

//prepare demo params
var demoParams = createParams([
], {
	title: 'Settings',
	popup: {
		type: 'sidebar',
		side: 'right',
		shift: 100
	}
});

//create main form
var params = createParams({
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
			//show placeholder
			if (value === 'text' || value === 'textarea') {
				params.setParam('placeholder', {
					hidden: false
				});
			}
			else {
				params.setParam('placeholder', {
					hidden: true
				});
			}
			params.setParam('example', {
				type: value
			});
		}
	},
	label: {
		label: 'Label',
		value: 'Field',
		placeholder: 'Field name...',
		change: function (value) {
			this.setParam('example', {
				label: value
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
			if (params.params.example.type === 'multirange') {
				v =  Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\s*,\s*|\n/) : [v, v];
			}

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
	placeholder: {
		label: 'Placeholder',
		placeholder: 'Placeholder...',
		type: 'text',
		change: (v) => {
			params.setParam('example', {placeholder: v});
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
		value: '+ Add field',
		// style: {minWidth: '50%', textAlign: 'center'},
		change: (v) => {
			var p = extend({}, params.params.example);
			p.element = null;
			demoParams.setParam('example-' + Object.keys(demoParams.params).length, {
				save: false,
				type: params.getParam('type'),
				label: params.getParam('label'),
				value: params.getParam('value'),
				values: params.getParam('values'),
				hidden: params.getParam('isHidden'),
				help: params.getParam('help')
			});
			params.setParam('label', {
				value: ''
			});
		}
	},
	previewTitle: {
		label: null,
		style: {
			textAlign: 'center',
			columnSpan: 'all',
			display: 'block'
		},
		create: () => {
			//return an html element with bound events
			return '<h3>It looks like that:</h3>'
		}
	},
	example: function () {
		return {
			save: false,
			type: this.getParam('type'),
			label: this.getParam('label'),
			value: this.getParam('value'),
			values: this.getParam('values'),
			hidden: this.getParam('isHidden'),
			help: this.getParam('help')
		};
	},
	// previewBtn: {
	// 	style: {textAlign: 'center', minWidth: '100%'},
	// 	create: () => demoParams.button,
	// }
}, {
	title: 'Create a new field',
	container: null
});


document.body.appendChild(params.element);
