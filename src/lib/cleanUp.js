
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

		process.on('cleanup',exitHandler)

		process.on('exit', () => {
			process.emit('cleanup')
		})

		process.on('SIGINT', () => {
			process.exit(2)
		})

		process.on('uncaughtException', e => {
			console.log('Uncaught Exception...')
			console.log(e.stack)
			process.exit(99)
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
