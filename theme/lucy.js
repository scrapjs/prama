/**
 * @module  prama/theme/lucy
 *
 * Round theme
 */

const px = require('add-px-to-style');
const fonts = require('google-fonts');
const color = require('tinycolor2');

fonts.add({
	'Ubuntu Condensed': 400,
	'Ubuntu Mono': true
});

module.exports = function () {
let defaultPalette = [
	'#00FFFA',
	'#999',
	'#eee',
	'#333',
	'#333'
];
let palette = this.palette || defaultPalette;

let bg = palette[4] || defaultPalette[4];
let primary = palette[0];
let secondary = palette[1];
let active = palette[2];
let dark = palette[3];

let mono = '"Ubuntu Mono", monospace';
let fontSize = 14;


function alpha (c, value) {
	return color(c).setAlpha(value).toString();
}

return `
	.prama {
		background: ${alpha(bg, .9)};
		color: ${primary};
		border-radius: .666em;
		width: 24em;
	}

	.prama-button {
		color: ${primary};
		fill: ${primary};
	}

	.popoff-close:hover {
		color: ${active};
	}

	.settings-panel {
		font-size: ${px('font-size', fontSize)};
		font-family: "Ubuntu Condensed", sans-serif;
	}

	.settings-panel-title {
		font-size: 2em;
		font-weight: normal;
		letter-spacing: 0;
		text-transform: none;
		text-shadow: 0 0 .666em ${alpha(primary, .2)};
	}

	.settings-panel-orientation-top .settings-panel-field,
	.settings-panel-orientation-bottom .settings-panel-field {
		text-align: center;
	}

	.settings-panel-field--interval .settings-panel-input,
	.settings-panel-field--interval .settings-panel-input,
	.settings-panel-field--range .settings-panel-input {
		text-align: left;
	}

	.settings-panel-textarea,
	.settings-panel input:not([type="range"]),
	.settings-panel-select {
		padding-left: .5em;
		padding-right: .5em;
		text-align: left;
	}

	/** Inputs fill */
	.settings-panel-interval,
	.settings-panel-value,
	.settings-panel-select,
	.settings-panel-text,
	.settings-panel-checkbox-label {
		background: none;
		color: ${secondary};
	}


	/** Text */
	.settings-panel-text {
		border: none;
		background: none;
	}

	.settings-panel-textarea {
		background: none;
		border: 0;
	}
	.settings-panel-text:focus,
	.settings-panel-textarea:focus {
		outline: none;
		color: ${active};
	}


	/** Select */
	.settings-panel-select {
		background: none;
		outline: none;
		border: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		-o-appearance:none;
		appearance:none;
		width: auto;
	}
	.settings-panel-select::-ms-expand {
		display:none;
	}
	.settings-panel-select-triangle {
		content: ' ';
		border-right: .3em solid transparent;
		border-left: .3em solid transparent;
		line-height: 2em;
		position: absolute;
		right: 2.5%;
		z-index: 1;
	}
	.settings-panel-select-triangle--down {
		top: 1.1em;
		border-top: .5em solid ${secondary};
		border-bottom: .0 transparent;
	}
	.settings-panel-select-triangle--up {
		top: .4em;
		border-bottom: .5em solid ${secondary};
		border-top: 0px transparent;
	}


	/** Switch style */
	.settings-panel-switch {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		color: ${secondary};
		font-family: ${mono};
		// vertical-align: top;
		// display: inline-block;
		// border: none;
		// margin: 0;
		// border-radius: 0;
		// padding: 0;
		// height: auto;
		// background: none;
		// vertical-align: top;
		// border: none;
		// position: relative;
		// overflow: hidden;
	}
	.settings-panel-switch-input {
		// display: none;
	}
	.settings-panel-switch-label {
		// position: relative;
		// height: 2em;
		// line-height: 2em;
		// min-width: 4em;
		// padding: 0 1em;
		// z-index: 2;
		// float: left;
		// text-align: center;
		// cursor: pointer;
	}
	.settings-panel-switch-input:checked + .settings-panel-switch-label {
		// background: black;
		// color: white;
	}


	/** Slider */
	.settings-panel-range {
		text-align: left;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		background: none;
		border-radius: 1em;
		color: ${secondary};
		margin-left: 15%;
		width: 70%;
	}
	.settings-panel-range:focus {
		outline: none;
		color: ${primary};
	}
	.settings-panel-range::-webkit-slider-runnable-track {
		background: ${secondary};
		height: 1px;
	}
	.settings-panel-range::-moz-range-track {
		background: ${secondary};
		height: 1px;
	}
	.settings-panel-range::-ms-fill-lower {
		background: ${secondary};
	}
	.settings-panel-range::-ms-fill-upper {
		background: ${secondary};
	}

	.settings-panel-range::-webkit-slider-thumb {
		background: ${secondary};
		border-radius: 1em;
		height: 1em;
		width: 1em;
		border: 0;
		cursor: ew-resize;
		-webkit-appearance: none;
		appearance: none;
		margin-top: -.5em;
	}
	.settings-panel-range::-moz-range-thumb {
		background: ${secondary};
		border-radius: 1em;
		height: 1em;
		width: 1em;
		border: 0;
		cursor: ew-resize;
		-webkit-appearance: none;
		margin-top: 0px;
	}
	.settings-panel-range::-ms-thumb {
		background: ${secondary};
		border-radius: 1em;
	}
	.settings-panel-field--interval .settings-panel-value:first-child {
		text-align: right;
	}
	.settings-panel-interval:after {
		content: '';
		position: absolute;
		width: 100%;
		left: 0;
		background: ${secondary};
		height: 1px;
		margin-top: 1em;
	}
	.settings-panel-interval-handle {
		position: absolute;
		z-index: 1;
		height: 1px;
		margin-top: 1em;
		background: ${active};
	}
	.settings-panel-interval-handle:after {
		content: '';
		position: absolute;
		right: 0;
		top: -.5em;
		width: 1em;
		height: 1em;
		border-radius: 1em;
		background: ${secondary};
	}
	.settings-panel-interval-handle:before {
		content: '';
		position: absolute;
		left: 0;
		top: -.5em;
		width: 1em;
		height: 1em;
		border-radius: 1em;
		background: ${secondary};
	}


	/** Checkbox */
	.settings-panel-field--checkbox {
	}
	.settings-panel-checkbox {
		display: none;
	}
	.settings-panel-checkbox-label {
		position: relative;
		display: inline-block;
		vertical-align: top;
		width: 4.5em;
		height: 2em;
		cursor: pointer;
		background: ${secondary};
		-webkit-transition: .4s;
		transition: .4s;
		border-radius: 2em;
	}
	.settings-panel-checkbox-label:before {
		position: absolute;
		content: "";
		height: 1em;
		width: 1em;
		left: .5em;
		bottom: .5em;
		background-color: ${active};
		-webkit-transition: .4s;
		transition: .4s;
		border-radius: 2em;
	}
	.settings-panel-checkbox:checked + .settings-panel-checkbox-label {
		background: ${secondary};
		box-shadow: none;
	}
	.settings-panel-checkbox:focus + .settings-panel-checkbox-label {
		box-shadow: 0 0 1px gray;
	}
	.settings-panel-checkbox:checked + .settings-panel-checkbox-label:before {
		left: calc(100% - 1.6em);
		box-shadow: none;
		background-color: ${active};
	}


	/** Placeholders */
	.settings-panel ::-webkit-input-placeholder {
		color: ${secondary};
	}
	.settings-panel ::-moz-placeholder {
		color: ${secondary};
	}
	.settings-panel :-ms-input-placeholder {
		color: ${secondary};
	}
	.settings-panel :-moz-placeholder {
		color: ${secondary};
	}

`}