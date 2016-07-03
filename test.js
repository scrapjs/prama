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
		value: false
	},
	sampleToggle: {
		type: 'toggle',
		value: true
	},
	sampleButtom: {
		type: 'button',
		value: 'xxx'
	},
	radio: {
		values: [1, 2, 3, 4],
		default: 1,
		value: 1,
		label: 'Radio list',
		type: 'radio'
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