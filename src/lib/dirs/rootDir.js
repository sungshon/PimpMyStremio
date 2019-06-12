const fs = require('fs')
const path = require('path')

let rootDir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')

if (!fs.existsSync(rootDir)) {
	rootDir = process.env['PMS_PACKAGED'] ? path.dirname(process.execPath) : path.join(__dirname, '..', '..', '..')
	process.env['PMS_CONFIG_DIR_NAME'] = 'LocalData'
}


module.exports = rootDir
