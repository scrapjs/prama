# Q: Name?

* biloba
	- not ginkgo :(
	- unlikely to develop/register ginkgo :(
		+ though theres a chance
	- not related with settings/params
		+ maybe for the better, as the extension of possible use-cases
			- unintuitive name still, main use-case is params
	- ginkgo deserves more
* parmesan
	+ some reference to param
* sett
	+ short
	+ reference to settings
* settie
* sety
* sets
* factors
* setti
	+ like setty
	- not setty
	- not english grammar
	+ reference
	+ short
	+ cute
* tuning
	+ free word
	+ related with settings
	+ a shade of other sense, like adjustment
* mood
* cogwheel
* settings-menu
	+ literally what it is
	+ settings in caption
* settings-constructor
* create-settings
* settings-form
* settings-page
* prams
* super-control-panel
	* - betrayal
	* - absence of vision
* settings-panel
	* - influenced by control-panel
	* + free
	* + reflects name properly
	* + no big reminescence of control-panel
	* +


# Q: Possible APIs?

* 1. Provide full-featured settings button, icon, interaction.
	+ easy to init only-settings for new components etc
	- not customizable, possible applications are limited, eg technically it could be possible to create complex settings pages, like "ginkgo forests".
* 2. Provide settings form only based off options. The way user places the form and wraps settings is up to him.
	+ highly customizable, allows for creating complex forms
	- a bit difficult as a standalone module: user has to care about the way to show settings icon, dialog or something, and maybe even interactions eg saving form etc.
	+ we avoid extra deps: popoff and an icon are relatively heavy.
* 3. Can we get the best of 1 and 2?
	- seems that we don’t need to: create settings button and show popup with content of biloba is not that difficult.
		+ though we should not really get down to pure API, having simple settings hassle-free is a big deal.

# Q: super-control-panel dep vs straight prama code

* + nicer inverval input
	* - we have one, just style it
* + super-control-panel has nice styles
	* - prama is flexible in that regard, but we need default styles
* + it shortens the code, significantly
	* - control-panel is mess inside, it is better for prama create a set of components. Also prama is easier to look through.
* - prama has dynamic API
* - prama has wider options
* + color input
	* - just connect color input

# Q: do we need themes?
* we need palette changing (default theme)
* 2-3 really different themes covering the most use-cases would be good.
	* default style theme (no theme)
	* control-panel replica (geeky monospace one)
	* round corners one (instances cases + design tools)
	* skeuo, typer-based, elegant (grayish)
	* minimalism (dragon theme)
+ that would allow for really custom looking menus.
- we could technically avoid themes, and stick to single style of inputs, differently colored. That would give a taste to prama
* imagine we create a waveform editor.
	- all inputs are styled already, we need default overridable theme.
* imagine we create harmonograph.
	+ we gotta find elegant gray-tone theme
* imagine we create typy - micro typographics prototyper
	+ we have lots of windows, we need neutral white minimalistic theme, like boutique
* imagine mandala-designer
	+ nice round corners one would be good
* plot-grid?
	+ dark round corners
* spectrograph
	+ rect, similar to dragon demo

# Q: what is the optimal way to organize themes?
1. require('prama/theme')
	+ simple
	- unusual
	+ no extra deps, require only needed straight ahead
	- impossible to switch theme
	- changing theme setting not in init, but in dep inclusion - no good
2. prama({ theme: require('prama/theme/merka') })
	+ conventional
	- long
	- separate property
	- bad paths, hussle setting up
	+ switchable themes
	* compromise between 1 and 3
		+ themes are not included by default
		+ intuitive and expected notation
	* theme should be an object, to tune styles a bit: palette, font, font-size, orientation
		- we can tune them directly via options, leaving theme for a style only
			+ no, we cannot tune font/font-size
				- user can, via redefining it in own styles
3. prama({ theme: 'light' })
	+ easy to use and remember, natural
	+ hussle-free
	+ switchable
	- loading all themes at once
		+ they are 4kb dev code per theme - not that huge, compressed only about .5kb ~= +5kb of compressed code for 5 themes.
			- still, extra-code, hard-coded, irreplaceable. It is not future-proof.

# Q: can we define common theme style with changeable variables?
- differentiation is good, we already tried one style - it tends to define too many variables.
+ but yes, we can define only palette if we stick to single style.

# Q: is it better to place palette, orientation, font-size in theme object or straight onto self?
1. Theme object
	- would require some update method, refreshing theme in case if it’s contents changed
		+ same is for the self
			- self is a bit easier to look for, changing theme dynamically is a bit more difficult here
2. Self
	+ allows for easier theme adjusting without theme switch
	+ allows for wider variables for the theme
	- font-size, font-family, radius etc belongs to theme
	+ enables palette pattern for other components, gl-spectrum etc
	+ orientation is a common property
3. It should be mix of theme params and self params
	? can theme override orientation, palette?
		* only via css
	+ that is the way it is done in hyperterm. It takes `decorateConfig` function, modifying input config (theme) as a param. Config may contain `css` property for additional style rules. But it has `foreground`, `background`, `cursor`, `fontSize`, `fontFamily` etc generic params.