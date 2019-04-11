const fs = require('fs')
const path = require('path')
const { VM, NodeVM } = require('vm2')

const bundle = require('./bundle')

const configDir = require('./dirs/configDir')()
const addonsDir = require('./dirs/addonsDir')()
const sideloadDir = require('./dirs/sideloadDir')()

const internal = {
	cinemeta: require('./cinemeta'),
	proxy: require('./proxy')
}

function vmEval(str) {
	return new Promise((resolve, reject) => {
		const val = new VM().run(str)
		if (val)
			resolve(val)
		else
			reject('Unknown eval error')
	})
}

const vmApi = {
	allowed: ['url', 'path', 'ent', 'm3u8-reader', 'needle', 'named-queue', 'video-name-parser', 'bin/youtube-dl', 'crypto-js', 'parse-torrent', 'xml-js', 'name-to-imdb', 'async', 'google', 'cheerio', 'jsdom', 'xml2js'],
	excluded: ['stremio-addon-sdk', 'internal', 'phantom', 'eval'],
	run: async opts => {

		const addonDir = opts.data.sideloaded ? sideloadDir : addonsDir

		const bundleJs = path.join(addonDir, opts.name, 'pms.bundle.js')

		if (!opts.data.sideloaded && !fs.existsSync(bundleJs)) {
			console.log(opts.name + 'Error: Could not run add-on, missing bundled dependency')
			return false
		}

		let modules = { internal }

		vmApi.allowed.forEach(module => {
			if (module.startsWith('bin/')) {
				const modName = module.replace('bin/','')
				const modPath = path.join(configDir, 'assets', modName)
				modules[modName] = require(fs.existsSync(modPath) ? modPath : modName)
			} else
				modules[module] = require(module)
		})

		modules.internal.config = opts.config

		modules.internal.persist = opts.persist

		modules['phantom'] = require('./phantom')

		modules['stremio-addon-sdk'] = require('./addonSdk')

		modules['eval'] = vmEval

		const ndVM = new NodeVM({
			sandbox: {},
			require: {
				root: path.join(addonDir, opts.name),
				mock: modules
			}
		})

		let addon = false

		if (process.env.PMS_UNSAFE && opts.data.sideloaded) {
			addon = require(bundleJs)
		} else {

			if (opts.data.sideloaded) {
				const bundled = await bundle(opts.name, path.join(addonDir, opts.name, 'index.js'), path.join(addonDir, opts.name), vmApi.excluded.concat(vmApi.allowed))
				if (!(bundled || {}).success) {
					console.log(name + 'Error: Could not bundle sandboxed add-on with webpack')
					return false
				}
			}

			const content = fs.readFileSync(bundleJs)

			try {
				addon = ndVM.run(content, bundleJs)
			} catch(e) {
				console.log(opts.name + ' error:')
				console.log(e)
			}
		}

		return addon

	}
}

module.exports = vmApi
