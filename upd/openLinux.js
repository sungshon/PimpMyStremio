const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')

const rootDir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')
const configDir = path.join(rootDir, 'PimpMyStremio')
const openFile = path.join(configDir, 'xdg-open')

module.exports = url => {
	fs.writeFileSync(openFile, fs.readFileSync(path.join(__dirname, 'xdg-open.json')))
	try {
		const child = spawn('chmod', [ '+x', openFile ], { stdio: 'ignore', detached: true })
		child.on('close', () => {
			const openChild = spawn(openFile, [ url ], { stdio: 'ignore', detached: true })
			openChild.on('close', () => {
				fs.unlinkSync(openFile)
			})
		})
	} catch(e) {
		console.error(e)
	}
}
