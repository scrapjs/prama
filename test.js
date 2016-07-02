var createParams = require('./');

var params = createParams({
	sampleText: {
		label: 'Text Field'
	},
	sampleNumber: {
		type: 'number'
	},
	sampleRange: {
		value: 75
	},
	sampleSelect: {
		values: [1,2,3],
		value: 2
	},
	sampleCheckbox: {
		value: true
	},
	sampleToggle: {
		type: 'toggle',
		value: true
	},
	sampleButtom: {
		type: 'button',
		value: 'xxx'
	},
	customField: {
		label: 'Custom Field',
		create: () => {
			//return an html element with bound events
			return '<input/>'
		}
	}
}, {
	title: 'Settings',
	ui: false,
	history: false,
	load: false
});

document.body.appendChild(params.element);