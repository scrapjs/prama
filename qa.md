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