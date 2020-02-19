// Shims for mobile devices (which do not support binaries)
// `youtube-dl` will be replaced with a remote version

const events = require('events')

const needle = require('needle')

const parseUrl = require('url')

function isEmptyObj(obj) {
	return JSON.stringify(obj || {}) == JSON.stringify({})
}

function resolveUrl(url, cb) {
	// resolves a URL in case of redirects
	needle.head(url, { method: 'HEAD' }, function (err, resp) {
		if ([301,302].includes((resp || {}).statusCode || 1) && ((resp || {}).headers || {}).location) {
			let newLocation = resp.headers.location
			if (newLocation.startsWith('/')) {
				const parsed = parseUrl.parse(url)
				newLocation = parsed.protocol + '//' + parsed.hostname + newLocation
			}
			resolveUrl(newLocation, cb)
		} else
			cb(url)
	})
}

module.exports = (url, args) => {

	args = args || []

	const validRequest = args.some(el => el === '-j')

	if (!validRequest) {
		setTimeout(() => {
			eventEmitter.emit('error', Error('Only JSON requests are supported with youtube-dl remote'))
		})
		return eventEmitter
	}

	const eventEmitter = new events.EventEmitter()

	resolveUrl(url, resolvedUrl => {

		needle.get('https://youtube-dl.now.sh/' + encodeURIComponent(resolvedUrl), { json: true }, (err, resp, body) => {
			if (!err && resp.statusCode == 200) {
				if (isEmptyObj(body))
					eventEmitter.emit('error', Error('Could not extract video'))
				else
					eventEmitter.emit('info', body)
			} else
				eventEmitter.emit('error', err || Error('Could not extract video'))
		})

	})

	return eventEmitter

}
