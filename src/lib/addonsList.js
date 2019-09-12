
const fs = require('fs')
const path = require('path')
const configDir = require('./dirs/configDir')()

module.exports = () => {
	const addonsListPath = path.join(configDir, 'addonsList.json')

	if (fs.existsSync(addonsListPath)) {

		// try to read the remote add-ons
		// list that was saved locally

		let addons

		try {
			addons = JSON.parse(fs.readFileSync(addonsListPath, 'utf8'))
		} catch(e) {
			// it should be safe to
			// ignore this error
		}

		return (addons || []).length ? addons : require('../addonsList')

	} else {

		// use internal add-ons list
		return require('../addonsList')

	}
}
