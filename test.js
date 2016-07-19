const extend = require('xtend/mutable');
const createParams = require('./');
const insertCSS = require('insert-css');
const palettes = require('nice-color-palettes/500');
const createPopup = require('popoff');


//prepare body
var meta = document.createElement('meta');
meta.setAttribute('name', 'viewport');
meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no');
document.head.appendChild(meta);

insertCSS(`
	body {
		margin: 0;
		position: relative;
	}

	body > .prama {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
`);


const themes = {
	none: {},
	control: require('./theme/control'),
	dragon: require('./theme/dragon'),
	merka: require('./theme/merka'),
	lucy: require('./theme/lucy'),
	typer: require('./theme/typer'),
};


//create main form
var pm = createParams({
	title: 'Settings',
	fields: [
		{label: 'Title', type: 'text', value: 'Settings', change: (v) => {
			pm.title = v;
		}},
		{label: 'Orientation', type: 'switch', options: 'top left bottom right'.split(' '), value: createParams.prototype.orientation, change: (v) => {
				pm.orientation = v;
			}
		},
		{label: 'Theme', type: 'select', options: Object.keys(themes), value: 'none', change: v => {
			pm.theme = themes[v];
		}},
		{label: 'Palette', type: 'custom', options: palettes, value: palettes[0], create: function () {
				let list = document.createElement('ul');
				let palette = this.value;
				palette.forEach((color) => {
					let item = document.createElement('li');
					item.style.background = color;
					list.appendChild(item);
				});

				return list;
			},
			change: () => {

			}
		},
		{label: 'Position', type: 'switch', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], value: 'top-right', change: (v) => {
				pm.position = v;
			}
		}
	],
	button: true
}).on('change', function () {
	pm.update();
});

pm.show();