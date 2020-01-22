
const api = require('./api')

module.exports = () => {

	let sum = 0
	let total = 0

	function announce() {

		const msg = 'Unpacking new version: ' + Math.round((sum / total) * 100) + '%'

		if (msg != api.getMsg())
			api.msg(msg)

	}

	return (entry, zipfile) => {

		sum++

		if (!total && zipfile.entryCount)
			total = zipfile.entryCount

		if (!total)
			return

		announce()

	}
}
