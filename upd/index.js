
const github = 'sungshon/PimpMyStremio-updates'

const isWin = process.platform === 'win32'
const isLinux = process.platform === 'linux'

function ext() { return (isWin ? '.exe' : '') }

const os = require('os')
const needle = require('needle')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const spawn = require('child_process').spawn

function msg(str) {
	console.log('PimpMyStremio - ' + str)
	if (api)
		api.msg(str)
}

function getBinDir() {
	const configDir = require('../src/lib/dirs/configDir')()

	const binDir = path.join(configDir, 'assets')

	return binDir
}

function getVersion(binDir) {
	const versionFile = path.join(binDir, '..', 'version')
	return !fs.existsSync(versionFile) ? false : fs.readFileSync(versionFile)
}

function saveVersion(binDir, version) {
	const versionFile = path.join(binDir, '..', 'version')
	fs.writeFileSync(versionFile, version)
	return true
}

function installed(binDir) {

	const requiredBins = ['engine' + ext(), 'phantom', 'web', 'youtube-dl', 'forked-systray']

	let isOk = true

	requiredBins.some(file => {
		if (!fs.existsSync(path.join(binDir, file))) {
			msg('Could not start engine')
			console.error('Missing required library: ' + file)
			isOk = false
			return true
		}
	})

	return isOk

}

function zipBall() {
	return new Promise((resolve, reject) => {
		const files = new Array()
		files.push('assets-' + process.platform + '-' + process.arch + '.zip')
		files.push('assets-' + process.platform + '.zip')
		needle.get('https://api.github.com/repos/' + github + '/releases', (err, resp, body) => {
			if (body && Array.isArray(body) && body.length) {
				const tag = body[0].tag_name
				let zipBall
				(body[0].assets || []).some(el => {
					if (files.indexOf(el.name) > -1) {
						zipBall = el.browser_download_url
						return true
					}
				})
				if (!zipBall) {
					reject('Could not find a valid package for your Operating System: ' + process.platform)
					return
				}
				resolve({ tag, zipBall })
			} else {
				if (err)
					console.error(err)
				reject('Could not get releases for: ' + github)
			}
		})
	})
}

function installEngine(binDir, githubData) {
	return new Promise((resolve, reject) => {
		const dest = binDir

		function installAddon() {
			msg('Downloading new version')
			needle('get', githubData.zipBall, { follow_max: 5 })
			.then(zipFile => {
				const tmpFile = path.join(os.tmpdir(), 'PimpMyStremio.zip')

				if (fs.existsSync(tmpFile))
					fs.unlinkSync(tmpFile)

				fs.writeFileSync(tmpFile, zipFile.body)

				msg('Finished downloading new version')

				var extract = require('extract-zip')

				msg('Unpacking new version')
				extract(tmpFile, { dir: path.join(binDir, '..') }, function (err) {
					fs.unlinkSync(tmpFile)
					if (err) {
						msg('Unzip error 2')
						console.error(err)
						reject()
						return
					} else {
						msg('Finished unpacking new version')
						saveVersion(binDir, githubData.tag)
					}
					msg('Updated to ' + githubData.tag)
					resolve()
				})
			})
			.catch(err => {
				msg('Unzip error 1')
				console.error(err)
				reject()
			})
		}

		function cleanDir(dest, cb) {
			fs.stat(dest, err => {
				if (!err) {
					msg('Removing old version')
					rimraf(dest, () => {
						cb()
					})
				} else if (err.code === 'ENOENT')
					cb()
			})
		}

		cleanDir(dest, installAddon)
	})
}

const clArgs = process.argv || []

const opts = {
	atStartup: clArgs.some(el => !!(el == '--startup')),
	noChildren: clArgs.some(el => !!(el == '--no-children')),
	isVerbose: clArgs.some(el => !!(el == '--verbose')),
	linuxTray: clArgs.some(el => !!(el == '--linux-tray')),
}

if (opts.linuxTray) // users can choose to force system tray, if they installed the deps manually
	opts.isVerbose = false
else if (isLinux) // on linux we default to verbose, as system tray it requires dependencies
	opts.isVerbose = true

clArgs.some(el => {
	if (el.startsWith('--sideload=')) {
		opts.sideloadDir = el.replace('--sideload=', '')
		return true
	}
})

function startEngine(binDir) {

	api.close()

	const env = Object.create(process.env)

	env['PMS_UPDATE'] = process.execPath

	if (opts.atStartup)
		env['PMS_STARTUP'] = '1'

	if (opts.noChildren)
		env['NO_CHILDREN'] = '1'

	if (opts.linuxTray)
		env['LINUX_TRAY'] = '1'

	if (opts.isVerbose)
		env['PMS_VERBOSE'] = '1'
	
	if (opts.sideloadDir)
		env['PMS_SIDELOAD'] = opts.sideloadDir

	const procOpts = { cwd: binDir, env }

	if (!opts.isVerbose) {
		procOpts.detached = true
		procOpts.stdio = 'ignore'
	}

	if (isWin)
		procOpts.windowsHide = true

	const addonProc = spawn(path.join(binDir, 'engine' + ext()), [], procOpts)

	if (opts.isVerbose) {
		addonProc.stdout.on('data', data => {
			if (data)
				console.log(data.toString().trim())
		})

		addonProc.stderr.on('data', data => {
			if (data)
				console.log(data.toString().trim())
		})

		addonProc.on('exit', code => {
			console.log('Process exit, code: ' + code)
			process.exit()
		})
	} else {
		msg('Starting engine, closing updater')
		addonProc.unref()
		process.exit()
	}

}

const binDir = getBinDir()

function afterInstall() {
	const isInstalled = installed(binDir)
	if (isInstalled)
		startEngine(binDir)
	else {
		console.error('Could not start PimpMyStremio, binaries missing')
		process.exit()
	}
}

const api = require('./api')

msg('Checking for updates')

zipBall().then(githubData => {

	const version = getVersion(binDir)

	if (!version || version != githubData.tag) {
		api.start()
		msg('New version found')
		installEngine(binDir, githubData).then(afterInstall).catch(afterInstall)
	} else {
		msg('Already have latest version')
		startEngine(binDir)
	}

}).catch(err => {
	console.error(err)
	afterInstall()
})
