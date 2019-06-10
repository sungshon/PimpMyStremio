const needle = require('needle')
const unzip = require('./lib/unzip')
const async = require('async')
const rimraf = require('rimraf')
const { exec } = require('pkg')

function zipBall(github) {
	return new Promise((resolve, reject) => {
		needle.get('https://api.github.com/repos/' + github + '/releases', (err, resp, body) => {
			if (body && Array.isArray(body) && body.length) {
				const tag = body[0].tag_name
				const zipBall = body[0].zipball_url
				resolve({
					tag: body[0].tag_name,
					zipBall: body[0].zipball_url
				})
			} else {
				if (err)
					console.error(err)
				reject(Error('Could not get releases for: ' + github))
			}
		})
	})
}

function getRepo(github, cb) {
	if (github == 'sungshon/forked-systray') {
		// use this installation only for 'forked-systray'
		const folderName = github.split('/')[1].replace('-node', '').replace('node-', '')
		const dest = path.join(assetsDir, folderName)
		console.log('Start - Download ' + folderName)
		zipBall(github).then(githubData => {
			if ((githubData || {}).zipBall)
				needle('get', githubData.zipBall, { follow_max: 5 })
				.then(async zipFile => {
					console.log('End - Download ' + folderName)
					const zipped = zipFile.body.toString('base64')
					console.log('Start - Unpack ' + folderName)
					fs.mkdirSync(dest)
					unzip.extract(zipped, dest)
					console.log('End - Unpack ' + folderName)
					console.log('Start - Install ' + folderName)
					npm(dest, () => {
						console.log('End - Install ' + folderName)
						console.log('Start - Build ' + folderName)
						npmBuild(dest, () => {
							console.log('End - Build ' + folderName)
							cb()
						})
					})
				})
				.catch(err => {
					console.log(github + ' unzip error')
					console.error(err)
					console.error(Error((err || {}).message || 'Unknown Error Occurred'))
				})
			else
				console.error('Invalid response while getting release for: ' + github)
		}).catch(e => {
			console.error(e)
		})
	} else {
		// use old installation method
		let folderName = github.split('/')[1].replace('-node', '').replace('node-', '')

		if (folderName == 'phantomjs')
			folderName = 'phantom'

		copyModule(folderName, folderName, cb)
	}
}

const repos = ['amir20/phantomjs-node', 'przemyslawpluta/node-youtube-dl', 'sungshon/forked-systray']

function getAllRepos(callback) {
	const q = async.queue((task, cb) => {
		getRepo(task.id, cb)
	})
	q.drain = () => {
		callback()
	}
	repos.forEach(el => { q.push({ id: el }) })
}

var isWin = process.platform === 'win32'

const fs = require('fs')
const path = require('path')
const ncp = require('ncp').ncp

const assetsDir = path.join(__dirname, '..', 'assets')

const modulesDir = path.join(__dirname, 'node_modules')

function ext() {
	return (isWin ? '.exe' : '')
}

const spawn = require('child_process').spawn

function npm(dest, cb) {
	spawn('npm' + (isWin ? '.cmd' : ''), ['i'], {
		cwd: dest,
		env: Object.create(process.env)
	}).on('exit', cb)
}

function npmProduction(dest, cb) {
	spawn('npm' + (isWin ? '.cmd' : ''), ['i', '--production'], {
		cwd: dest,
		env: Object.create(process.env)
	}).on('exit', cb)
}

function npmBuild(dest, cb) {
	spawn('npm' + (isWin ? '.cmd' : ''), ['run', 'build'], {
		cwd: dest,
		env: Object.create(process.env)
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
		npmProduction(path.join(__dirname, '..', 'assets', mod), () => {
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
	const fromLoc = path.join(__dirname, 'node_modules', mod , filename + ext())
	const toLoc = path.join(__dirname, '..', 'assets', mod , filename + ext())
	function end() {
		console.log('End - Copying binary for ' + modName)
		cb()
	}
	if (fs.existsSync(fromLoc))
		fs.copyFile(fromLoc, toLoc, end)
	else
		end()
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

	exec(['package.json', '--target', 'host', '--output', '../assets/engine' + ext()]).then(() => {

		console.log('Finished!')

	}).catch(err => {
		if (err)
			console.error(err)
		console.log('Finished!')
	})

}

rimraf(assetsDir, () => {
	if (!fs.existsSync(assetsDir))
		fs.mkdirSync(assetsDir)
	copyWeb(() => {
		getAllRepos(() => {
			fixLinux(() => {
				packageApp()
			})
		})
	})
})
