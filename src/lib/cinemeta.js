const needle = require('needle')

module.exports = {
	get: (req = {}) => {
		if (!req.type || ['movie', 'series'].indexOf(req.type) == -1)
			reject(Error('Unsupported request type for cinemeta: ' + JSON.stringify(req)))
		if (!req.imdb || !req.imdb.startsWith('tt'))
			reject(Error('Unsupported request imdb id for cinemeta: ' + JSON.stringify(req)))

		return new Promise((resolve, reject) => {
			needle.get('https://v3-cinemeta.strem.io/meta/' + req.type + '/' + req.imdb + '.json', (err, resp, body) => {
				if (body && body.meta) {
					resolve(body.meta)
				} else {
					reject(err || Error('Unknown error in cinemeta for request: ' + JSON.stringify(req)))
				}
			})
		})
	}
}
