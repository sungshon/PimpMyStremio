const opn = require('open')
const path = require('path')
const configDir = require('./dirs/configDir')()

function openLinux(url) {
	try {
		require('child_process').spawn(path.join(configDir, 'assets', 'xdg-open'), [ url ], { stdio: 'ignore', detached: true })
	} catch(e) {}
}

module.exports = url => {
	opn(url, { wait: true }).catch((e) => {
		if (process.platform == 'linux')
			openLinux(url)
		else {
			console.log('Non-critical: Could not auto-open webpage, presuming Linux OS')
			console.error(e)
		}
	})
}
