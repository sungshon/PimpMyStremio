const opn = require('open')
const path = require('path')
const fs = require('fs')
const configDir = require('./dirs/configDir')()

function openLinux(url) {
	const xdgOpenPath = path.join(configDir, 'assets', 'xdg-open')
	if (fs.existsSync(xdgOpenPath)) {
		try {
			require('child_process').spawn(xdgOpenPath, [ url ], { stdio: 'ignore', detached: true })
		} catch(e) {}
	}
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
