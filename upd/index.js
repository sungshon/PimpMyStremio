
const github = 'sungshon/PimpMyStremio-updates'

var isWin = process.platform === 'win32'

function ext() { return (isWin ? '.exe' : '') }

const os = require('os')
const needle = require('needle')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const spawn = require('child_process').spawn

function msg(str) {
	console.log('PimpMyStremio - ' + str)
	api.msg(str)
}

function getBinDir() {
	const rootDir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')

	const configDir = path.join(rootDir, 'PimpMyStremio')

	if (!fs.existsSync(configDir))
		fs.mkdirSync(configDir)

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

	const requiredBins = ['engine' + ext(), 'phantom', 'web', 'youtube-dl']

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

function startEngine(binDir) {
	const newEnv = JSON.parse(JSON.stringify(process.env))

	newEnv['PMS_UPDATE'] = process.execPath

	const atStartup = (process.argv || []).some(el => !!(el == '--startup'))

	if (atStartup)
		newEnv['PMS_STARTUP'] = '1'

	const addonProc = spawn(path.join(binDir, 'engine' + ext()), [],
		{
			cwd: binDir,
			env: newEnv
		})

	addonProc.stdout.on('data', data => {
		if (data) {
			console.log(data.toString().trim())
//			var sData = String(data).replace(/(\r\n\t|\n|\r\t)/gm,'')
		}

	})

	addonProc.stderr.on('data', data => {
		if (data) {
			console.log(data.toString().trim())
//			var sData = String(data).replace(/(\r\n\t|\n|\r\t)/gm,'')
		}
	})

	addonProc.on('exit', code => {
		console.log('Process exit, code: ' + code)
		process.exit()
	})

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
		msg('New version found')
		installEngine(binDir, githubData).then(afterInstall).catch(afterInstall)
	} else {
		msg('Already running latest version')
		startEngine(binDir)
	}

}).catch(err => {
	console.error(err)
	afterInstall()
})
