var createParams = require('./');

var params = createParams({
	sampleText: {
		label: 'Label',
		placeholder: 'Field name...'
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
	sampleText: {
		label: 'Label',
		placeholder: 'Field name...'
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
	}
}, {
	title: 'Settings',
	ui: false,
	history: false,
	load: false
});

document.body.appendChild(params.element);