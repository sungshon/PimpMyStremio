
const fs = require('fs')
const path = require('path')
const configDir = require('./configDir')()

let addonConfigDir

module.exports = () => {
	if (addonConfigDir)
		return addonConfigDir

	addonConfigDir = path.join(configDir, 'config')

	if (!fs.existsSync(addonConfigDir))
		fs.mkdirSync(addonConfigDir)

	return addonConfigDir
}
