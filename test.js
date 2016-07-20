const extend = require('just-extend');
const createParams = require('./');
const insertCss = require('insert-styles');
const palettes = require('nice-color-palettes/500');
const createPopup = require('popoff');
const css = require('dom-css');
const sortable = require('sortablejs');


//prepare body
var meta = document.createElement('meta');
meta.setAttribute('name', 'viewport');
meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no');
document.head.appendChild(meta);

insertCss(`
	body {
		margin: 0;
		position: relative;
		min-height: 100vh;
		background: url('./demo/images/landscape.jpg');
		background-position: center top;
		background-size: cover;
	}
`);


const themes = {
	none: {},
	lucy: require('./theme/lucy'),
	// typer: require('./theme/typer'),
	// control: require('./theme/control'),
	// dragon: require('./theme/dragon'),
	// merka: require('./theme/merka'),
};


//create main form
var pm = createParams({
	title: 'Settings',
	fields: [
		// {label: 'Title', type: 'text', value: 'Settings', change: (v) => {
		// 	pm.title = v;
		// }},
		{label: 'Orientation', type: 'switch', options: 'top left bottom right'.split(' '), value: createParams.prototype.orientation, change: (v) => {
				pm.orientation = v;
			}
		},
		{label: 'Theme', type: 'select', options: Object.keys(themes), value: 'none', change: v => {
			pm.theme = themes[v];
		}},
		{label: 'Palette', type: 'custom', options: palettes, value: palettes[0], save: false, create: function (opts) {
				let list = document.createElement('ul');
				let palette = opts.value;

				if (typeof palette === 'string') {
					palette = palette.split(',');
				}

				css(list, {
					listStyle: 'none',
					margin: 0,
					padding: 0
				});

				palette.forEach((color) => {
					let item = document.createElement('li');
					item.title = color;
					css(item, {
						height: '2em',
						width: '2em',
						display: 'inline-block',
						background: color
					});
					list.appendChild(item);
				});

				let sortman = new sortable(list, {
					group: 'palette'
				});

				return list;
			},
			change: (v) => {
				if (!v) pm.palette = null;
				else pm.palette = v.split(/\s*,\s*/);
			}
		},
		// {label: 'Position', type: 'switch', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], value: 'top-right', change: (v) => {
		// 		pm.position = v;
		// 	}
		// },
		{label: 'Font size', type: 'range', value: 12, min: 8, max: 20, step: .5, change: (v) => {

		}},
		{label: 'Width', type: 'interval', value: [100, 200], min: 100, max: 600, step: 1, change: (v) => {

		}},
		{label: 'Draggable', type: 'checkbox', value: true, style: `width: 33%; display: inline-block; margin: 4em 0 0;`, orientation: 'bottom' },
		{label: 'History', type: 'checkbox', value: false, style: `width: 33%; display: inline-block; margin: 4em 0 0;`, orientation: 'bottom' },
		{label: 'Session', type: 'checkbox', value: false, style: `width: 33%; display: inline-block; margin: 4em 0 0;`, orientation: 'bottom' }
	],
	button: true
}).on('change', function () {
	pm.update();
});

pm.show();