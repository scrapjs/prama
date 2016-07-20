/**
 * List of various panel styles
 */

const Panel = require('../');
const insertCss = require('insert-css');

insertCSS(`
	body {
		margin: 0;
	}
`);


test('merka', () => {
	//FIXME: research other majority of use-cases to detect what is common, what is custom here
	const merka = Panel([
		{
			type: 'toggle',
			label: `<i class="icon-notifications"></i> Notifications`,
			style: theme => `
				background: ${theme.background2};
				border-radius: 3px;
			`,
			value: true
		},
		{
			type: 'volume',
			label: false
		},
		{
			type: 'title',
			label: '<i class="icon-style"></i> Style'
		},
		{
			type: 'switch',
			label: false,
			options: {
				brightness: '<i class="icon-brightness"></i>',
				contrast: '<i class="icon-contrast"></i>'
			},
			value: 'contrast',
			style: theme => `
				padding: 0 1em;
			`
		},
		{
			type: 'color',
			label: 'Primary color'
		},
		{
			type: 'color',
			label: 'Secondary color'
		},
		{
			type: 'toggle',
			label: '<i class="icon-refresh"></i> Auto refresh',
			value: true,
			style: theme => `
				background: ${theme.background2};
			`
		},
		{
			type: 'select',
			label: 'Refresh interval',
			options: ['1m', '10m', '15m', '30m', '1h']
		},
		{
			type: 'toggle',
			label: 'Auto refresh on cellular',
			value: false
		}
	], {
		theme: {
			fontFamily: 'sans-serif',
			fontSize: 13,
			background: 'rgb(95, 95, 104)',
			background2: 'rgb(65, 66, 76)',
			foreground: 'rgb(40, 40, 47)',
			primary: 'rgb(22, 151, 255)',
			secondary: 'rgb(255, 255, 255)',
			radius: 3,

			//generic adjustments
			fieldStyle: `
			`,

			labelPosition: 'left',
			labelWidth: '50%',
			labelStyle: `
				padding-left: 1em;
				text-transform: uppercase;
				letter-spacing: .6ex;
				font-size: .6em;
			`,

			//per-component adjustments
			titleStyle: theme => `
				text-transform: uppercase;
				letter-spacing: .888ex;
				font-size: .888em;
				font-weight: bold;
				background: ${theme.background2};
				height: 3em;
				line-height: 3em;
				padding-left: 1em;
				border-radius: .3em;
			`,

			switchStyle: theme => `
			`,

			buttonStyle: theme => `
			`,

			rangeThumbStyle: theme => `
			`,

			rangeTrackStyle: theme => `
			`
		}
	})
});


test.only('lucy', () => {
	const lucy = Panel({
		title: 'Settings',
		fields: [
			{ type: 'range', label: 'Transparency', min: 0, max: 100, value: 20 },
			{ type: 'range', label: 'Color', min: 0, max: 100, value: 80 },
			{ type: 'range', label: 'Contrast', min: 0, max: 100, value: 60 },
			{ type: 'range', label: 'Saturation', min: 0, max: 100, value: 40 },
			{ type: 'range', label: 'Brightness', min: 0, max: 100, value: 70 },

			//FIXME: find a more elegant/generic way to modify label positino
			{ type: 'toggle', label: 'Lorem', value: true, style: {width: '33.33%'}, orientation: 'bottom' }
			{ type: 'toggle', label: 'Ipsum', value: false, style: {width: '33.33%'}, orientation: 'bottom' }
			{ type: 'toggle', label: 'Dolor', value: false, style: {width: '33.33%'}, orientation: 'bottom' }
		],
		theme: require('../themes/lucy'),
		draggable: true
	});
});


test('neutral', () => {
	const neutral = Panel({
		'View': {
			type: 'switch',
			options: ['List', 'Grid'],
			value: 'Grid',
			label: false //FIXME: find out whether we should manually set width: 100%
		},

		'Max Items': { type: 'number', disabled: true, value: 0},
		'Scroll Direction': { type: 'select', value: 'Vertical', options: ['Vertical', 'Horizontal']},
		'Columns': { type: 'number', value: 3, min: 1, max: 12},
		'Padding': { type: 'number', value: 2, min: 0, max: 36}
	});
});


test('kuzh', () => {
	const kuzh = Panel([
		{type: 'title', label: 'Add Customer'},
		{type: 'switch', label: 'Customer type', options: ['Individual', 'Art Gallery'], value: 'Individual'},
		//FIXME: is it good or we should generalize to 'custom'?
		{type: 'br'},

		//FIXME: should we place icon as a field property, as style or how?
		{type: 'text', label: 'Full Name', value: 'Matheas Dembluk', icon: './profile.svg'},

		//FIXME: width here should be for the field, not for the style of input
		//or should we group items into a row? +allows for custom row style, allows for columns
		{type: 'tel', label: 'Phone Number', value: '508-214-531', icon: './phone.svg', style: 'width: 50%'},
		{type: 'email', label: 'Email Address', value: 'contact@dembsky.me', icon: './plane.svg', style: 'width: 50%'},

		{type: 'br'},

		{type: 'address', label: 'Address', value: 'Alleja Jerumskije, 123A'},
		{type: 'text', label: 'Town', value: 'Warszhawa', style: 'width: 50%'},
		{type: 'text', label: 'Zip-Code', value: '00-000', style: 'width: 50%'},

		//FIXME: again, how to say 2-columns?
		//FIXME: how to differentiate button colors, inc. active?
		{type: 'button', label: 'Cancel', style: {background: 'gray'}},
		{type: 'button', label: 'Save Customer'},
	]);
});


test('dragon', () => {
	//FIXME: is there a better way to set title label?
	//FIXME: rule, vec2, unit - are these all required?
	const dragon = Panel([
		{type: 'custom', content: 'dragon_feature<br/><em>image</em>'},
		{type: 'rule'},
		{type: 'select', label: '<i class="axes"></i> Axis', options: ['Local', 'Parent', 'World'], value: 'Local'},
		{type: 'rule'},
		{type: 'vec2', label: 'Translation'},
		{type: 'unit', label: 'Rotation', unit: 'ᴼ'},
		{type: 'vec2', label: 'Scale'}
	], {theme: 'dragon'})
});

test('cta', () => {
	//TODO: there is toggle-button question
});

test('truffel', () => {
	//TODO:
});

test('rng', () => {
	//TODO:
});

test('gils', () => {

});

test('ghost', () => {

});

test('voda', () => {

});

test('typer', () => {

});

test('ppl', () => {

});
