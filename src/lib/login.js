
const userConfig = require('./config/userConfig')

module.exports = {
	hidden: () => {
		return new Promise((resolve, reject) => {
			const pass = userConfig.readPass()
			const passLength = (pass || '').length
			let hiddenPass = ''
			if (passLength)
				hiddenPass = Array.apply(null, Array(passLength)).map(el => '*').join('')
			resolve({ pass: hiddenPass })
		})
	},
	check: testPass => {
		return new Promise((resolve, reject) => {
			const pass = userConfig.readPass()
			resolve({ success: !!(!pass || pass == testPass) })
		})
	}
}