
const fs = require('fs')
const path = require('path')
const rootDir = require('./rootDir')

let configDir

module.exports = () => {
	if (configDir)
		return configDir

	configDir = path.join(rootDir, process.env['PMS_CONFIG_DIR_NAME'] || 'PimpMyStremio')

	if (!fs.existsSync(configDir))
		fs.mkdirSync(configDir)

	return configDir
}
