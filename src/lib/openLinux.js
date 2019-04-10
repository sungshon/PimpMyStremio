
const path = require('path')
const configDir = require('./dirs/configDir')()

module.exports = url => {
	try {
		require('child_process').spawn(path.join(configDir, 'assets', 'xdg-open'), [ url ], { stdio: 'ignore', detached: true })
	} catch(e) {}
}