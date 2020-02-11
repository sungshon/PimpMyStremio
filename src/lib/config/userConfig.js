
const fs = require('fs')
const path = require('path')
const nanoid = require('nanoid')

const configDir = require('../dirs/configDir')()

const configFile = 'PimpMyStremio-userConfig.json'

const defaultConfig = {
	installedAddons: [],
	runningAddons: [],
	userDefined: {
		autoLaunch: {
			title: 'Run on start-up',
			type: 'boolean',
			default: false
		},
		theme: {
			title: 'Theme',
			type: 'select',
			options: ["Light", "Dark", "Rusty", "Sky", "Light Orange", "Light Blue", "Light Green", "Dark Purple", "Dark Blue", "Dark Green"],
			default: "Light"
		},
		serverPort: {
			title: 'Server port',
			type: 'number',
			default: 7777
		},
		password: {
			title: 'Server Password',
			type: 'string',
			default: ''
		},
		addonsListUrl: {
			title: 'Remote Add-ons List URL',
			type: 'string',
			default: 'https://raw.githubusercontent.com/sungshon/PimpMyStremio/master/src/addonsList.json'
		},
		externalUse: {
			title: "Remote Access",
			type: "select",
			options: ["No (local)", "LAN", "External"],
			default: "No (local)"
		},
	}
}

let password = ''

// fixes settings if new properties were added / removed
function fixSettings(config) {
	for (let key in defaultConfig.userDefined)
		if (typeof config.userDefined[key] === 'undefined')
			config.userDefined[key] = defaultConfig.userDefined[key]

	for (let key in config.userDefined)
		if (typeof defaultConfig.userDefined[key] === 'undefined')
			delete config.userDefined[key]

	for (let key in config.userDefined)
		if (config.userDefined[key].options
			&& JSON.stringify(config.userDefined[key].options) != JSON.stringify(defaultConfig.userDefined[key].options))
			config.userDefined[key].options = defaultConfig.userDefined[key].options

	return config
}

const configDb = {
	compress: data => {
		const obj = {}
		const userDefined = {}

		for (let key in defaultConfig.userDefined)
			userDefined[key] = (data.userDefined[key] || {}).value || defaultConfig.userDefined[key].default

		return {
			installedAddons: data.installedAddons,
			runningAddons: data.runningAddons,
			userDefined
		}
	},
	expand: data => {
		const userDefined = {}
		for (let key in defaultConfig.userDefined) {
			userDefined[key] = defaultConfig.userDefined[key]
			userDefined[key].value = data.userDefined[key]
		}
		data.userDefined = userDefined
		return data
	},
	readClean: () => {
		const configFilePath = path.join(configDir, configFile)
		if (fs.existsSync(configFilePath)) {
			let config

			try {
				config = JSON.parse(fs.readFileSync(configFilePath).toString())
			} catch(e) {
				// ignore read file issues
				return defaultConfig
			}

			config = fixSettings(config)

			return config
		} else
			return defaultConfig
	},
	readPass: () => {
		return password
	},
	read: () => {

		const configFilePath = path.join(configDir, configFile)

		if (fs.existsSync(configFilePath)) {
			let config

			try {
				config = JSON.parse(fs.readFileSync(configFilePath).toString())
			} catch(e) {
				// ignore read file issues
				return configDb.compress(defaultConfig)
			}

			config = fixSettings(config)

			const compressed = configDb.compress(config)
			if (!password && compressed.userDefined.password)
				password = compressed.userDefined.password
			return compressed
		} else
			return configDb.write(configDb.compress(defaultConfig))

	},
	writeSettings: data => {
		return new Promise((resolve, reject) => {
			const obj = configDb.readClean()
			obj.userDefined = data
			configDb.write(obj)
			resolve({ success: true })
		})
	},
	write: data => {
		const obj = configDb.expand(data)
		const configFilePath = path.join(configDir, configFile)

		try {
			fs.writeFileSync(configFilePath, JSON.stringify(obj))
		} catch(e) {
			console.log('error write')
			console.error(e)
			// ignore write file issues
			return configDb.compress(defaultConfig)
		}

		return configDb.read()
	},
	addons: {
		installed: {
			add: data => {
				const userData = configDb.read()
				const installedAddons = []
				userData.installedAddons.forEach(addon => {
					if (addon.repo != data.repo)
						installedAddons.push(addon)
				})
				userData.installedAddons = installedAddons
				userData.installedAddons.push(data)
				configDb.write(userData)
			},
			remove: data => {
				const userData = configDb.read()
				const installedAddons = []
				userData.installedAddons.forEach(addon => {
					if (addon.repo != data.repo)
						installedAddons.push(addon)
				})
				userData.installedAddons = installedAddons
				configDb.write(userData)
			}
		},
		running: {
			add: data => {
				const userData = configDb.read()
				const runningAddons = []
				userData.runningAddons.forEach(addon => {
					if (addon.repo != data.repo)
						runningAddons.push(addon)
				})
				userData.runningAddons = runningAddons
				userData.runningAddons.push(data)
				configDb.write(userData)
			},
			remove: data => {
				const userData = configDb.read()
				const runningAddons = []
				userData.runningAddons.forEach(addon => {
					if (addon.repo != data.repo)
						runningAddons.push(addon)
				})
				userData.runningAddons = runningAddons
				configDb.write(userData)
			}
		}
	}
}

module.exports = configDb
