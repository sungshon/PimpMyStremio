
const fs = require('fs')
const path = require('path')
const configDir = require('./configDir')()

let persistDir

module.exports = () => {
	if (persistDir)
		return persistDir

	persistDir = path.join(configDir, 'persist')

	if (!fs.existsSync(persistDir))
		fs.mkdirSync(persistDir)

	return persistDir
}
