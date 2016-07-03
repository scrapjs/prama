var createParams = require('./');

var params = createParams({
	sampleText: {
		label: 'Field name',
		value: 'Result',
		placeholder: 'Field name...',
		change: function (value) {
			this.setParam('result', {
				label: value
			});
		}
	},
	sampleNumber: {
		label: 'Number',
		value: 75
	},
	sampleRange: {
		label: 'Range',
		value: [11, 22]
	},
	select: {
		values: ['text', 'number', 'textarea', 'toggle', 'select', 'switch'],
		value: 'text',
		change: () => {}
	},
	sampleToggle: {
		label: 'Multiple',
		value: true,
		disabled: true
	},
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
		create: () => {
			//return an html element with bound events
			return 'Some <em>custom</em> html'
		}
	},
	result: {
		label: 'Result'
	}
}, {
	title: 'Settings',
	ui: false,
	history: false,
	load: false
});

document.body.appendChild(params.element);