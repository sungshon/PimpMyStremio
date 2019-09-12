
const fs = require('fs')
const path = require('path')
const configDir = require('./configDir')()

let sideloadDir

module.exports = () => {
	if (sideloadDir)
		return sideloadDir

	if (process.env['PMS_SIDELOAD']) {
		const dir = process.env['PMS_SIDELOAD'].split('"').join('')
		if (fs.existsSync(dir))
			sideloadDir = dir
		else
			console.log('Warning: Custom sideload directory leads to non-existent folder, using default path.')
	}
	
	if (!sideloadDir) {
		sideloadDir = path.join(configDir, 'sideload')

		if (!fs.existsSync(sideloadDir))
			fs.mkdirSync(sideloadDir)
	}

	return sideloadDir
}
