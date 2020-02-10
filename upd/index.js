
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

const configDir = require('../src/lib/dirs/configDir')()

function getBinDir() {
	return path.join(configDir, 'assets')
}

function getAddonsListPath() {
	return path.join(configDir, 'addonsList.json')	
}

function getRemoteAddonsUrl() {
	const configFilePath = path.join(configDir, 'PimpMyStremio-userConfig.json')
	if (fs.existsSync(configFilePath)) {
		let config

		try {
			config = JSON.parse(fs.readFileSync(configFilePath).toString())
		} catch(e) {
			// ignore read file issues
			return false
		}

		return (((config || {}).userDefined || {}).addonsListUrl || {}).value
	} else
		return false
}

function versionToInt(str) {
	return parseInt(str.replace('v', '').split('.').join(''))
}

function updateAddonsList() {
	return new Promise((resolve, reject) => {
		// default url:
		let listUrl = 'https://raw.githubusercontent.com/sungshon/PimpMyStremio/master/src/addonsList.json'

		const addonsListUrl = getRemoteAddonsUrl()

		if (addonsListUrl) {
			// test user defined url for sanity
			const isUrl = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
			if (isUrl.test(addonsListUrl)) {
				msg('User defined add-ons list URL is valid, updating add-ons list')
				listUrl = addonsListUrl
			} else
				msg('User defined add-ons list URL is invalid, using default URL')
		}

		needle.get(listUrl, (err, resp, body) => {
			try {
				body = JSON.parse(body)
			} catch(e) {}
			if (body && Array.isArray(body) && body.length) {
				let version = getVersion(binDir)
				version = version ? versionToInt(version) : 1

				const addons = body.filter(addon => {
					// filter out add-ons that are not currently supported by this version
					return !!(!addon.requires || versionToInt(addon.requires) <= version)
				})

				if (addons.length) {
					try {
						fs.writeFileSync(getAddonsListPath(), JSON.stringify(addons))
						msg('Successfully updated add-ons list from remote source')
					} catch(e) {
						msg('Warning: Could not write data from remote add-ons list to disk')
					}
				} else {
					msg('Warning: Remote add-ons list seems empty')
				}

			} else {
				msg('Warning: Invalid response from the remote add-ons list')
			}
			resolve()
		})
	})
}

function getVersion(binDir) {
	const versionFile = path.join(binDir, '..', 'version')
	let version = !fs.existsSync(versionFile) ? false : fs.readFileSync(versionFile)
	version = version && Buffer.isBuffer(version) ? version.toString() : false
	return version
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

		function installUpdate() {
			msg('Downloading new version')

			const tmpFile = path.join(os.tmpdir(), 'PimpMyStremio.zip')

			if (fs.existsSync(tmpFile))
				fs.unlinkSync(tmpFile)

			const file = fs.createWriteStream(tmpFile);

			const req = needle.get(githubData.zipBall, { follow_max: 5 })

			req.pipe(file).on('finish', err => {
				if (err) {
					msg('Download error: ' + (err.message || 'Unknown error'))
					console.error(err)
					reject()
					return
				}

				msg('Finished downloading new version')

				var extract = require('extract-zip')

				msg('Unpacking new version')

				let extracted = 0

				extract(tmpFile, {
					dir: path.join(binDir, '..'),
					onEntry: unzipProgress()
				}, function (err) {
					fs.unlinkSync(tmpFile)
					if (err) {
						msg('Unzip error: ' + (err.message || 'Unknown error'))
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

			downloadProgress(req)

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

		cleanDir(dest, installUpdate)
	})
}

const clArgs = process.argv || []

const opts = {
	atStartup: clArgs.some(el => !!(el == '--startup')),
	noChildren: clArgs.some(el => !!(el == '--no-children')),
	isVerbose: clArgs.some(el => !!(el == '--verbose')),
	linuxTray: clArgs.some(el => !!(el == '--linux-tray')),
	shouldUninstall: clArgs.some(el => !!(el == '--uninstall')),
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

clArgs.some(el => {
	if (el.startsWith('--lan-ip=')) {
		opts.lanIp = el.replace('--lan-ip=', '').replace(/[^0-9.]/g, '')
		return true
	}
})

async function startEngine(binDir) {

	await updateAddonsList()

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
	
	if (opts.lanIp)
		env['PMS_LAN_IP'] = opts.lanIp

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

const downloadProgress = require('./downloadProgress')

const unzipProgress = require('./unzipProgress')

let api

if (!opts.shouldUninstall) {

	api = require('./api')

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

} else {

	// uninstall PimpMyStremio

	msg('Uninstalling PimpMyStremio')

	rimraf(configDir, { maxBusyTries: 100 }, err => {
		if (err) {
			console.error(err)
			process.exit()
			return
		}
		msg('Successfully uninstalled PimpMyStremio')
		process.exit()
	})
}
