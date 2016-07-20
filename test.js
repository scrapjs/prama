const extend = require('just-extend');
const createParams = require('./');
const insertCss = require('insert-styles');
const palettes = require('nice-color-palettes/500');
const createPopup = require('popoff');
const css = require('dom-css');
const sortable = require('sortablejs');
const Picker = require('simple-color-picker');


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
		background: url('./images/landscape.jpg');
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
			if (!pm.get('Palette') || !pm.get('Palette').length) pm.set('Palette', pm.theme.palette);
		}},
		{label: 'Palette', type: 'custom', options: palettes, save: false, create: function (opts) {
				let list = document.createElement('ul');

				let palette = opts.value || themes[this.panel.get('Theme')].palette || [];

				if (typeof palette === 'string') {
					palette = palette.split(',');
				}

				css(list, {
					listStyle: 'none',
					margin: '.5em 0 0',
					padding: 0,
					height: '2em',
					display: 'inline-block',
					boxShadow: `0 0 .666em ` + palette[3]
				});

				palette.forEach((color) => {
					let item = document.createElement('li');
					item.title = color;
					item.setAttribute('data-id', color);
					css(item, {
						height: '2em',
						width: '2em',
						display: 'inline-block',
						background: color
					});
					list.appendChild(item);

					//create picker for each color
					let picker = new Picker({
						el: item,
						color: color
					});
					picker.$el.style.display = 'none';
					item.onmouseout = (e) => {
						picker.$el.style.display = 'none'
					}
					item.onmouseover = function () {
						picker.$el.style.display = ''
					}
					picker.onChange((color) => {
						css(item, {background: color});
						item.setAttribute('data-id', color);
						sortman && this.emit('change', sortman.toArray());
					})
				});

				let sortman = new sortable(list, {
					onUpdate: (e) => {
						this.emit('change', sortman.toArray());
					}
				});

				setTimeout(() => {
					this.emit('init', palette);
				});

				return list;
			},
			change: (v) => {
				if (!v) pm.palette = null;
				else if (Array.isArray(v)) pm.palette = v;
				else pm.palette = v.split(/\s*,\s*/);
			}
		},
		// {label: 'Position', type: 'switch', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], value: 'top-right', change: (v) => {
		// 		pm.position = v;
		// 	}
		// },
		{label: 'Font size', type: 'range', value: 14, min: 8, max: 20, step: .5, change: (v) => {
			pm.fontSize = v;
		}},
		{label: 'Width', type: 'interval', value: [100, 200], min: 100, max: 600, step: 1, change: (v) => {

		}},
		{label: 'Draggable', type: 'checkbox', value: true, style: `width: 33%; display: inline-block; margin-bottom: 1em; margin-top: 2em;`, orientation: 'bottom' },
		{label: 'History', type: 'checkbox', value: false, style: `width: 33%; display: inline-block; margin-bottom: 1em; margin-top: 2em;`, orientation: 'bottom' },
		{label: 'Session', type: 'checkbox', value: false, style: `width: 33%; display: inline-block; margin-bottom: 1em; margin-top: 2em;`, orientation: 'bottom' }
	],
	button: true
}).on('change', function () {
	pm.update();
});

pm.show();