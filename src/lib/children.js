// we run all add-ons in separate processes
const fork = require('child_process').fork
const proxy = require('./proxy')
const events = require('./events')

const isWin = process.platform === 'win32'

let childName = process.env['CHILD']

if (childName) {

	const startAddon = async addonName => {
		const addon = require('./addon')
		const sideload = require('./sideload')

		let manifest
		try {
			manifest = await sideload.getManifest(addonName)
		} catch(e) {}

		if (!manifest)
			manifest = addon.getManifest(addonName)

		if (!manifest) {
			console.error(new Error('Manifest for ' + addonName + ' cannot be found'))
			process.send({ status: 'error', error: 'Manifest for ' + addonName + ' cannot be found' })
			process.exit()
			return
		}

		addon.run(manifest, true).then(() => {
			process.send({ status: 'running', manifest: addon.get(addonName).manifest })
		}).catch((err) => {
			process.send({ status: 'error', error: err.message || ('Unknown error for: ' + addonName) })
		})

		process.on('message', msg => {
			if (msg) {
				if (msg == 'die') {
					addon.stop(addon.getManifest(addonName)).then(() => {
						process.send({ status: 'ended' })
					}).catch(err => {
						process.send({ status: 'ended', error: (err || {}).message || ('Could not stop add-on, it is not running: ' + addonName) })
					})
				} else if (msg.endpoint) {
					proxy.setEndpoint(msg.endpoint)
				} else if (((msg || {}).url || '').startsWith('/')) {
					const urlPath = msg.url
					const vmAddon = addon.get(addonName)
					if ((vmAddon || {}).router) {
						const resShim = {
							headers: {},
							setHeader: (prop, val) => { resShim.headers[prop] = val },
							statusCode: 200,
							writeHead: val => { resShim.statusCode = val },
							end: data => {
								process.send({ url: urlPath, headers: resShim.headers, statusCode: resShim.statusCode, data })
							}
						}
						vmAddon.router.handle({ headers: msg.headers, url: urlPath, method: 'GET' }, resShim, () => {})
					}
				}
			}
		})
	}
	startAddon(childName)
} else {
	events.on('set-endpoint-children', endpoint => {
		for (let key in children)
			if ((children[key] || {}).send)
				children[key].send({ endpoint })
	})
}

const children = {}

module.exports = {
	create: addonName => {
		return new Promise((resolve, reject) => {

			const parameters = []

			const env = Object.create(process.env)

			env.CHILD = addonName

			const options = {
				detached: !isWin,
				stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
				env
			}

			if (isWin)
				options.windowsHide = true

			const child = fork(__filename, parameters, options)

			child.stdout.pipe(process.stdout)
			child.stderr.pipe(process.stderr)

			child.on('message', obj => {
				if (obj.proxy)
					proxy.addProxy(obj.url, obj.opts)
			})

			function router(req, res) {
				function awaitResponse(obj) {
					if (obj.url == req.url) {

						if (!timeOut) return
						else { clearTimeout(timeOut); timeOut = false }

						for (let key in obj.headers)
							res.setHeader(key, obj.headers[key])

						res.writeHead(obj.statusCode)
						res.end(obj.data)
						child.removeListener('message', awaitResponse)
					}
				}
				const name = ((req.url || '').split('/') || [])[1]
				let timeOut = setTimeout(() => {
					timeOut = false
					child.removeListener('message', awaitResponse)
					res.setHeader('Access-Control-Allow-Origin', '*')
					res.statusCode = 404
					res.end()
					events.emit('kill-addon', { name, reason: name + ' - add-on was stopped for taking longer then 2 mins to answer a request' })
				}, 120000)
				child.on('message', awaitResponse)
				child.send({ url: req.url, headers: req.headers })
			}

			function awaitStatus(obj) {
				if (obj.status) {
					child.removeListener('message', awaitStatus)
					if (obj.status == 'running') {
						child.send({ endpoint: proxy.getEndpoint() })
						children[addonName] = child
						resolve({ manifest: obj.manifest, router })
					} else
						reject(new Error(obj.error || ('Could not run add-on: ' + addonName)))
				}
			}

			child.on('message', awaitStatus)

		})

	},
	kill: addonName => {
		return new Promise((resolve, reject) => {
			if (children[addonName]) {
				let child = children[addonName]
				function killProcess(hasError) {
					child.kill('SIGINT')
					children[addonName] = null
					child = null
					if (hasError)
						reject(new Error(hasError))
					else
						resolve({ success: true })
				}
				function awaitClose(obj) {
					if (obj.status && obj.status == 'ended') {
						child.removeListener('message', awaitClose)
						killProcess(obj.error)
					}
				}
				child.on('message', awaitClose)
				child.send('die')
			} else {
				reject('Could not stop add-on, it is not running: ' + addonName)
			}
		})
	}
}
