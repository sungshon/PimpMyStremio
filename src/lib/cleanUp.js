
const {spawn} = require('child_process')
const addons = require('./addon')
const systray = require('./systray')
const _ = require('lodash')

let server

function repoFromStack(stack) {
	let repoName

	let matches = e.stack.match(/\/[a-z0-9-_]+\/pms\.bundle(\.verbose)?\.js/gmi)

	if ((matches || []).length)
		repoName = matches[0].split('/')[1]

	if (!repoName) {
		matches = e.stack.match(/\/PimpMyStremio\/addons\/[a-z0-9-_]+\//gmi)
		if ((matches || []).length)
			repoName = matches[0].split('/')[3]
	}

	return repoName
}

function errorLog(type, e) {
	if (e instanceof Error) {
		if (e.stack) {
			const repoName = repoFromStack(e.stack)

			if (repoName) {
				const repoName = matches[0].split('/')[1]
				console.log(repoName + ' - ' + type)
				console.log(e.stack)
				addons.stop(addons.getManifest(repoName), true).catch(e => {})
			} else {
				console.log(type + '...')
				console.log(e.stack)
				process.exit(0)
			}
		} else
			console.error(e)
	}	
}

module.exports = {
	set: (serv) => {

		server = serv

		const exitHandler = _.once(async exitCode => {
			if ((server || {}).close)
				server.close()
			await systray.kill()
			await addons.persistAll()
			process.exit()
		})

		const signals = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM']

		signals.forEach(sig => {
			process.on(sig, () => { exitHandler(sig) })
		})

		process.on('uncaughtException', errorLog.bind('Uncaught Exception'))

 		process.on('unhandledRejection', errorLog.bind('Unhandler Promise Rejection'))
	},
	restart: () => {
		if (server)
			server.close()
		server = null
		const execPath = process.env['PMS_UPDATE'] || process.argv[1]
		spawn(execPath, process.argv.slice(2), {
			detached: true
		}).unref()
		process.exit()
	}
}
