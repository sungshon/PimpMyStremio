const fs = require('fs')
const path = require('path')
const sideloadDir = require('../dirs/sideloadDir')()
const addonsDir = require('../dirs/addonsDir')()

function validate(tag, config) {
	if (typeof config === 'object' && config !== null) {
		let success = false
		if (Object.keys(config).length) {
			const errs = []
			for (let key in config) {
				const cfg = config[key]

				if (!cfg.type)
					errs.push(tag + ' - Config error, the "' + key + '" setting is missing "type"')
				else if (['string', 'number', 'boolean', 'select'].indexOf(cfg.type) == -1)
					errs.push(tag + ' - Config error, the "' + key + '" setting\'s "type" is not an accepted type')

				if (!cfg.title)
					errs.push(tag + ' - Config error, the "' + key + '" setting is missing "title"')
				else if (typeof cfg.title != 'string')
					errs.push(tag + ' - Config error, the "' + key + '" setting\'s "title" is not a string')

				if (cfg.type == 'select') {
					if (cfg.default && typeof cfg.default != 'string')
						errs.push(tag + ' - Config error, the "' + key + '" select setting\'s "default" is not a string')
				} else {
					if (cfg.default && typeof cfg.default != cfg.type)
						errs.push(tag + ' - Config error, the "' + key + '" setting\'s "default" is not a ' + cfg.type)
				}

				if (cfg.required && typeof cfg.required != 'boolean')
					errs.push(tag + ' - Config error, the "' + key + '" setting\'s "required" is not boolean')

				if (cfg.type == 'select' && (!cfg.options || !Array.isArray(cfg.options) || !cfg.options.length))
					errs.push(tag + ' - Config error, the "' + key + '" setting has "select" type, but no "options" set')
			}
			if (errs.length) {
				errs.forEach(err => { console.error(err) })
				return false
			}
		}
		return true
	} else {
		console.error(tag + ' - Config error, the configuration file does not include an object')
		return false
	}
}

module.exports = {
	get: (name, data) => {
		const addonDir = data.sideloaded ? sideloadDir : addonsDir
		const file = path.join(addonDir, name, 'config.json')
		let config = {}
		if (fs.existsSync(file)) {
			try {
				config = JSON.parse(fs.readFileSync(file, 'utf8'))
			} catch(e) {
				console.error('Could not parse config for: ' + name)
				console.error(e)
			}
		}
		return validate(name, config) ? config : {}
	}
}
