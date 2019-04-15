
const {spawn} = require('child_process')
const addons = require('./addon')

let server

module.exports = {
	set: (serv) => {

		server = serv

		const exitHandler = (options, exitCode) => {
			if ((server || {}).close)
				server.close()
			addons.persistAll()
			process.exit()
		}

		process.on('cleanup', exitHandler)

		process.on('exit', () => {
			process.emit('cleanup')
		})

		process.on('SIGINT', () => {
			process.exit(0)
		})

		process.on('uncaughtException', e => {
			const matches = e.stack.match(/\/[a-z0-9-_]+\/pms\.bundle\.js/gmi)
			if ((matches || []).length) {
				const repoName = matches[0].split('/')[1]
				console.log(repoName + ' - Uncaught Exception')
				console.log(e.stack)
				addons.stop(addons.getManifest(repoName)).catch(e => {})
			} else {
				console.log('Uncaught Exception...')
				console.log(e.stack)
				process.exit(0)
			}
		})

 		process.on('unhandledRejection', (e, p) => {
 			if (e instanceof Error && e.stack) {
 				const matches = e.stack.match(/\/[a-z0-9-_]+\/pms\.bundle\.js/gmi)
				const repoName = matches[0].split('/')[1]
				console.log(repoName + ' - Unhandler Promise Rejection')
				console.log(e.stack)
				addons.stop(addons.getManifest(repoName)).catch(e => {})
 			} else {
				console.log('Unhandler Promise Rejection...')
				console.log(e.stack)
 				process.exit(0)
 			}
 		})
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
