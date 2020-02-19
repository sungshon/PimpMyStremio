// Shims for mobile devices (which do not support binaries)
// `phantomjs` is not supported on mobile devices

module.exports = {
	load: (opts, clArgs, opts2, cb) => {

		const events = require('events')

		const page = new events.EventEmitter()

		page.open = () => { return Promise.reject('Not supported on mobile devices') }

		cb({}, page)

	},
	close: (instance = {}, page = {}, cb = (() => {})) => {

		cb()

	}
}
