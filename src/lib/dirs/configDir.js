
const fs = require('fs')
const path = require('path')
const rootDir = require('./rootDir')

let configDir

module.exports = () => {
	if (configDir)
		return configDir

	configDir = path.join(rootDir, 'PimpMyStremio')

	if (!fs.existsSync(configDir))
		fs.mkdirSync(configDir)

	return configDir
}
