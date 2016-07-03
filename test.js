var createParams = require('./');

var params = createParams({
	sampleText: {
		label: 'Field name',
		value: 'Field',
		placeholder: 'Field name...',
		change: function (value) {
			this.setParam('example', {
				label: value
			});
		}
	},
	sampleType: {
		label: 'Type',
		values: ['text', 'number', 'multirange', 'textarea', 'toggle', 'select', 'switch'],
		value: 'text',
		change: (value) => {
			params.setParam('example', {
				type: value
			});
		}
	},
	sampleNumber: {
		label: 'Value',
		value: 75,
		change: (v) => {
			params.setParam('example', v);
		}
	},
	//TODO: make dependent on multirange/range type
	// sampleRange: {
	// 	label: 'Range',
	// 	value: [11, 22]
	// },
	// sampleToggle: {
	// 	label: 'Multiple',
	// 	value: true,
	// 	disabled: true
	// },
	sampleButton: {
		label: '',
		type: 'button',
		value: 'Add field'
	},
	radio: {
		values: [1, 2, 3, 4],
		default: 1,
		value: 1,
		label: 'Switch',
		type: 'radio'
	},
	customField: {
		label: 'Custom Field',
		style: {
			marginTop: '4rem',
			textAlign: 'center'
		},
		create: () => {
			//return an html element with bound events
			return '<h3>Result:</h3>'
		}
	},
	example: {
		type: 'text',
		label: 'Field'
	}
}, {
	title: 'Settings',
	ui: false,
	history: false,
	load: false
});

document.body.appendChild(params.element);