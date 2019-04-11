
var isWin = process.platform === 'win32'

const fs = require('fs')
const path = require('path')
const ncp = require('ncp').ncp

const assetsDir = path.join(__dirname, '..', 'assets')

if (!fs.existsSync(assetsDir))
	fs.mkdirSync(assetsDir)

const modulesDir = path.join(__dirname, 'node_modules')

function ext() {
	return (isWin ? '.exe' : '')
}

const spawn = require('child_process').spawn

function npm(dest, cb) {
	spawn('npm', ['i', '--production'], {
		cwd: dest,
		env: JSON.parse(JSON.stringify(process.env))
	}).on('exit', cb)
}

function copyWeb(cb) {
	console.log('Start - Copy Web Content')
	ncp('./web', '../assets/web', function (err) {
		if (err)
			return console.error(err)
		console.log('End - Copy Web Content')
		cb()
	})
}

function copyYoutube(cb) {
	console.log('Start - Copy Youtube-dl')
	ncp('./node_modules/youtube-dl', '../assets/youtube-dl', function (err) {
		if (err)
			return console.error(err)
		console.log('End - Copy Youtube-dl')
		console.log('Start - Build Youtube-dl')
		npm(path.join(__dirname, '..', 'assets', 'youtube-dl'), () => {
			console.log('End - Build Youtube-dl')
			cb()
		})
	})
}

function copyPhantom(cb) {
	console.log('Start - Copy PhantomJS')
	ncp('./node_modules/phantom', '../assets/phantom', function (err) {
		if (err)
			return console.error(err)
		console.log('End - Copy PhantomJS')
		console.log('Start - Build PhantomJS')
		npm(path.join(__dirname, '..', 'assets', 'phantom'), () => {
			console.log('End - Build PhantomJS')
			cb()
		})
	})
}

function fixLinux(cb) {
	if (process.platform == 'linux')
		cb()
	else {
		console.log('Patching for Linux')
		const xdgOpen = path.join(__dirname, 'node_modules', 'open', 'xdg-open')
		if (fs.existsSync(xdgOpen))
			fs.copyFileSync(xdgOpen, path.join(assetsDir, 'xdg-open'))
		cb()
	}
}

function packageApp() {

	console.log('Start - Packaging App to Executable')

	const { exec } = require('pkg')

	exec(['package.json', '--target', 'host', '--output', '../assets/engine' + ext()]).then(() => {
		console.log('Finished!')
	}).catch(err => {
		console.log('Finished!')
	})
}

copyWeb(() => {
	copyYoutube(() => {
		copyPhantom(() => {
			fixLinux(() => {
				packageApp()
			})
		})
	})
})
