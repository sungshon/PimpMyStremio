const fs = require('fs')
const path = require('path')
const { VM, NodeVM } = require('vm2')

const bundle = require('./bundle')

const configDir = require('./dirs/configDir')()
const addonsDir = require('./dirs/addonsDir')()
const sideloadDir = require('./dirs/sideloadDir')()

const isMobile = require('./isMobile').isMobile

const internal = {
	cinemeta: require('./cinemeta'),
	proxy: require('./proxy')
}

function vmEval(str) {
	return new Promise((resolve, reject) => {
		const val = new VM({ timeout: 60000 }).run(str)
		if (val)
			resolve(val)
		else
			reject('Unknown eval error')
	})
}

const vmApi = {
	allowed: [
		'url', 'path', 'ent', 'm3u8-reader', 'needle', 'named-queue', 'video-name-parser',
		'bin/youtube-dl', 'crypto-js', 'parse-torrent', 'xml-js', 'name-to-imdb', 'async',
		'lodash', 'google-it', 'cheerio', 'jsdom', 'xml2js', 'cache-manager', 'bottleneck',
		'magnet-uri', 'torrent-name-parser', 'request', 'cheerio-without-node-native',
		'cross-fetch', 'cloudscraper', 'axios', 'remote-file-size', 'base-64', 'compare-versions',
		'js-events-listener', 'qs', 'string_decoder', 'm3u8-parsed', 'discord-rpc', 'zombie'
	],
	excluded: ['stremio-addon-sdk', 'internal', 'phantom', 'eval', 'dom-storage'],
	allModules: () => {
		return vmApi.excluded.concat(vmApi.allowed.map(el => { return el.replace('bin/', '') }))
	},
	run: async opts => {

		const addonDir = opts.data.sideloaded ? sideloadDir : addonsDir

		const isVerbose = !process.env['PMS_UPDATE'] ? true : !!(process.env['PMS_UPDATE'] && process.env['PMS_VERBOSE'])

		let bundleJs = path.join(addonDir, opts.name, 'pms.bundle' + (isVerbose ? '.verbose' : '') + '.js')

		if (!opts.data.sideloaded && !fs.existsSync(bundleJs)) {
			console.log(opts.name + 'Error: Could not run add-on, missing bundled dependency')
			return false
		}

		let modules = { internal }

		vmApi.allowed.forEach(module => {
			if (module.startsWith('bin/')) {
				const modName = module.replace('bin/','')
				let modPath
				if (!isMobile) {
					modPath = path.join(configDir, 'assets', modName)
					modPath = fs.existsSync(modPath) ? modPath : modName
				} else {
					// mobile devices don't support binaries, we'll use shims instead
					modPath = './shims/' + modName
				}
				modules[modName] = require(modPath)
			} else
				modules[module] = require(module)
		})

		modules.internal.config = opts.config

		modules.internal.persist = opts.persist

		// mobile devices don't support binaries, we'll use shims instead
		modules['phantom'] = !isMobile ? require('./phantom') : require('./shims/phantom')

		modules['stremio-addon-sdk'] = require('./addonSdk')

		modules['eval'] = vmEval

		modules['dom-storage'] = require('./domStorageShim')(opts.persist)

		const ndVM = new NodeVM({
			sandbox: {},
			require: {
				root: path.join(addonDir, opts.name),
				mock: modules
			}
		})

		let addon = false

		if (opts.data.sideloaded) {
			bundleJs = path.join(addonDir, opts.name, 'pms.bundle.verbose.js')
			const bundled = await bundle(opts.name, path.join(addonDir, opts.name, 'index.js'), path.join(addonDir, opts.name), vmApi.allModules(), true)
			if (!(bundled || {}).success) {
				console.log(name + 'Error: Could not bundle sandboxed add-on with webpack')
				return false
			}
		}

		const content = fs.readFileSync(bundleJs)

		try {
			addon = await ndVM.run(content, bundleJs)
		} catch(e) {
			console.log(opts.name + ' error:')
			console.log(e)
		}

		return addon

	}
}

module.exports = vmApi
