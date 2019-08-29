const sideloadDir = require('./dirs/sideloadDir')()
const addon = require('./addon')
const fs = require('fs')
const path = require('path')

const isDirectoryOrSymLink = source => fs.lstatSync(source).isDirectory() || fs.lstatSync(source).isSymbolicLink()
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectoryOrSymLink)

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
	getManifest: name => {
		return new Promise((resolve, reject) => {
			validAddons().then(manifests => {
				if (manifests.length) {
					let manifest
					manifests.some(el => {
						if (el.repo.endsWith('/' + name)) {
							manifest = el
							return true
						}
					})
					if (manifest)
						resolve(manifest)
					else
						reject(new Error('Could not find manifest for: ' + name))
				} else
					reject(new Error('Could not get manifest for: ' + name))
			})
		})
	},
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
