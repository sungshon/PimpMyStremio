const fs = require('fs')
const path = require('path')
const persistDir = require('./dirs/persistDir')()

module.exports = {
	get: tag => {
		const file = path.join(persistDir, tag + '.json')
		let persist
		if (!fs.existsSync(file)) {
			persist = {}
			fs.writeFileSync(file, JSON.stringify(persist), 'utf8')
		} else
			persist = JSON.parse(fs.readFileSync(file, 'utf8'))
		return persist
	},
	set: (tag, persist) => {
		const file = path.join(persistDir, tag + '.json')
		fs.writeFileSync(file, JSON.stringify(persist), 'utf8')
		return true
	}
}