
const fs = require('fs')
const path = require('path')
const configDir = require('./configDir')

module.exports = () => {

	if (process.env['PMS_UPDATE'])
		return path.join(configDir(), 'assets', 'web')

	if (fs.existsSync('src/web'))
		return 'src/web'

	return 'web'

}
