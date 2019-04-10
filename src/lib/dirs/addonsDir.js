
const fs = require('fs')
const path = require('path')
const configDir = require('./configDir')()

let addonsDir

module.exports = () => {
	if (addonsDir)
		return addonsDir

	addonsDir = path.join(configDir, 'addons')

	if (!fs.existsSync(addonsDir))
		fs.mkdirSync(addonsDir)

	return addonsDir
}
