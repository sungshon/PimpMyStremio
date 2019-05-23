
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
	spawn('npm' + (isWin ? '.cmd' : ''), ['i', '--production'], {
		cwd: dest,
		env: JSON.parse(JSON.stringify(process.env))
	}).on('exit', cb)
}

function npmBuild(dest, cb) {
	spawn('npm' + (isWin ? '.cmd' : ''), ['run', 'build'], {
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

function copyModule(mod, modName, cb) {
	console.log('Start - Copy ' + modName)
	ncp('./node_modules/' + mod, '../assets/' + mod, function (err) {
		if (err)
			return console.error(err)
		console.log('End - Copy ' + modName)
		console.log('Start - Install ' + modName)
		npm(path.join(__dirname, '..', 'assets', mod), () => {
			console.log('End - Install ' + modName)
			cb()
		})
	})
}

function buildModule(mod, modName, cb) {
	console.log('Start - Build ' + modName)
	npmBuild(path.join(__dirname, '..', 'assets', mod), () => {
		console.log('End - Build ' + modName)
		cb()
	})
}

function copyFile(mod, modName, filename, cb) {
	console.log('Start - Copying binary for ' + modName)
	if (fs.existsSync('./node_modules/' + mod + '/' + filename + (isWin ? '.exe' : '')))
		fs.copyFileSync('./node_modules/' + mod + '/' + filename + (isWin ? '.exe' : ''), '../assets/' + mod + '/' + filename + (isWin ? '.exe' : ''))
	console.log('End - Copying binary for ' + modName)
	cb()
}

function fixLinux(cb) {
	if (process.platform != 'linux')
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
		if (err)
			console.error(err)
		console.log('Finished!')
	})
}

copyWeb(() => {
	copyModule('youtube-dl', 'Youtube-dl', () => {
		copyModule('phantom', 'PhantomJS', () => {
			copyModule('forked-systray', 'Systray', () => {
				buildModule('forked-systray', 'Systray', () => {
					copyFile('forked-systray', 'Systray', 'systrayhelper', () => {
						fixLinux(() => {
							packageApp()
						})
					})
				})
			})
		})
	})
})
