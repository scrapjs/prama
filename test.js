var createParams = require('./');

var params = createParams({
	sampleText: {
		label: 'Title',
		value: 'Settings',
		change: (value) => {
			params.title = value;
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
		values: [1,2,3],
		value: 2
	},
	sampleToggle: {
		label: 'Toggle',
		value: true
	},
	sampleButton: {
		label: '',
		type: 'button',
		value: 'Randomize'
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