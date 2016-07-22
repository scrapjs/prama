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
		background-attachment: fixed;
	}
	.frame {
		min-height: 100vh;
		position: relative;
		width: calc(100% - 240px);
	}
`);


const themes = {
	none: false,
	lucy: require('./theme/lucy'),
	// typer: require('./theme/typer'),
	// control: require('./theme/control'),
	dragon: require('./theme/dragon'),
	// merka: require('./theme/merka'),
};


var frame = document.createElement('div');
frame.classList.add('frame');
document.body.appendChild(frame);


//create demo form

var preview = createParams({
	title: 'Preview',
	id: 'preview',
	fields: [
		{type: 'switch', label: 'Switch', options: ['One', 'Two', 'Three'], value: 'One'},
		{type: 'range', label: 'Range slider', min: 0, max: 100, value: 20, help: 'Default slider'},
		{type: 'range', label: 'Range stepped', min: 0, max: 1, step: 0.2, value: 0.6},
		{type: 'range', scale: 'log', label: 'Range slider (log)', min: 0.01, max: 100, value: 1, after: '<hr/>'},
		{type: 'text', label: 'Text', value: 'my setting'},
		{type: 'checkbox', label: 'Checkbox', value: true},
		{type: 'color', label: 'Color rgb', format: 'rgb', value: 'rgb(100,200,100)'},
		{type: 'button', label: 'Gimme an alert', input: function () { window.alert('hello!') }},
		{type: 'interval', label: 'An interval', min: 0, max: 10, value: [3, 4], steps: 20, before: '<hr/>'},
		{type: 'select', label: 'Array select', options: ['State One', 'State Two'], value: 'State One'},
		{type: 'email', label: 'Email', placeholder: 'email'},
		{type: 'textarea', label: 'Long text', placeholder: 'long text...'}
	],
	//FIXME: if there is no popup, there is no way to bind button, therefore false popup == false button
	popup: true,
	button: true,
	container: frame,
	theme: false,
	session: false
});



//create main form
var settings = createParams({
	fields: [
		// {label: 'Title', type: 'text', value: 'Settings', change: (v) => {
		// 	preview.title = v;
		// }},
		{label: 'Orientation', type: 'switch', options: 'top left bottom right'.split(' '), value: createParams.prototype.orientation, change: (v) => {
				preview.orientation = v;
			}
		},
		{label: 'Theme', type: 'select', options: Object.keys(themes), value: 'none', change: v => {
			preview.theme = themes[v];
			settings.set('Palette', preview.theme.palette);
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
				if (!v) preview.palette = null;
				else if (Array.isArray(v)) preview.palette = v;
				else preview.palette = v.split(/\s*,\s*/);
			}
		},
		// {label: 'Position', type: 'switch', options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], value: 'top-right', change: (v) => {
		// 		preview.position = v;
		// 	}
		// },
		{label: 'Font size', type: 'range', value: 14, min: 8, max: 20, step: .5, change: (v) => {
			preview.fontSize = v;
		}},
		{label: 'Width', type: 'interval', value: [100, 200], min: 100, max: 600, step: 1, change: (v) => {

		}},
		{label: 'Draggable', type: 'checkbox', value: true },
		{label: 'History', type: 'checkbox', value: false },
		{label: 'Session', type: 'checkbox', value: false }
	],
	popup: {
		type: 'sidebar',
		side: 'right',
		closable: false
	},
	theme: require('./theme/dragon'),
	button: false,
	orientation: 'left'
}).on('change', function () {
	preview.update();
});


settings.show();
preview.show();