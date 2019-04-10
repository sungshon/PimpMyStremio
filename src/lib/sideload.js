const sideloadDir = require('./dirs/sideloadDir')()
const addon = require('./addon')
const fs = require('fs')
const path = require('path')

const isDirectory = source => fs.lstatSync(source).isDirectory()
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

function validAddons() {
	return new Promise((resolve, reject) => {
		const manifests = []
		const dirs = getDirectories(sideloadDir)
		dirs.forEach(dir => {
			const dirName = dir.split(path.sep).pop()
			if (!fs.existsSync(path.join(dir, 'index.js')))
				console.error('Cannot sideload ' + dirName + ', missing index.js')
			else
				manifests.push({
					name: 'Sideload',
					logo: 'https://cdn.dribbble.com/users/151802/screenshots/839869/sideload.png',
					description: 'Sideloaded add-on: ' + dirName,
					types: ['Sideloaded'],
					repo: 'dev/' + dirName,
					sideloaded: true
				})
		})
		resolve(manifests)
	})
}

module.exports = {
	loadAll: cb => {
		return new Promise((resolve, reject) => {
			validAddons().then(manifests => {
				if (manifests.length)
					addon.init(manifests, cb)
				else
					cb()
			})
		})
	}
}
