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
		} else {
			try {
				persist = JSON.parse(fs.readFileSync(file, 'utf8'))
			} catch(e) {
				persist = {}
				fs.writeFileSync(file, JSON.stringify(persist), 'utf8')
			}
		}
		return {
			setItem: (par, val) => {
				if (par && val && typeof par == 'string')
					persist[par] = val
			},
			getItem: (par) => {
				if (par && typeof par == 'string')
					return persist[par]
				return false
			},
			removeItem: (par) => {
				if (par && typeof par == 'string')
					delete persist[par]
			},
			clear: () => {
				persist = {}
			},
			getObj: () => { return persist }
		}
	},
	set: (tag, persist) => {
		const file = path.join(persistDir, tag + '.json')
		fs.writeFileSync(file, JSON.stringify(persist), 'utf8')
		return true
	}
}
