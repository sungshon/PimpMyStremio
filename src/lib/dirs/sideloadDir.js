
const fs = require('fs')
const path = require('path')
const configDir = require('./configDir')()

let sideloadDir

module.exports = () => {
	if (sideloadDir)
		return sideloadDir

	sideloadDir = path.join(configDir, 'sideload')

	if (!fs.existsSync(sideloadDir))
		fs.mkdirSync(sideloadDir)

	return sideloadDir
}
