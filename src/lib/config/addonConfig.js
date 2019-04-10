const fs = require('fs')
const path = require('path')
const addonConfigDir = require('../dirs/addonConfigDir')()

module.exports = {
	get: tag => {
		const file = path.join(addonConfigDir, tag + '.json')
		let config = {}
		if (fs.existsSync(file)) {
			try {
				config = JSON.parse(fs.readFileSync(file, 'utf8'))
			} catch(e) {}
		}
		return config
	},
	set: (tag, config) => {
		const file = path.join(addonConfigDir, tag + '.json')
		fs.writeFileSync(file, JSON.stringify(config), 'utf8')
		return true
	}
}