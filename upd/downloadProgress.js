
const api = require('./api')

module.exports = req => {

	let sum = 0
	let total = 0

	function announce() {

		const msg = 'Download progress: ' + Math.round((sum / total) * 100) + '%'

		if (msg != api.getMsg())
			api.msg(msg)

	}

	req.on('data', (chunk) => {

		sum += chunk.length

		if (!total)
			return

		announce()
	})

	req.on('header', (status, headers) => {

		if (status == 200 && headers['content-length'])
			total = headers['content-length']

	})

}
