
const pkg = require('./lib/pkg')
const express = require('express')
const getPort = require('get-port')
const tunnel = require('./lib/tunnels/serveo')
const autoLaunch = require('./lib/autoLaunch')
const addon = require('./lib/addon')
const uConfig = require('./lib/config/userConfig')
const userConfig = uConfig.read().userDefined
const runningAddons = uConfig.read().runningAddons
const proxy = require('./lib/proxy')
const persist = require('./lib/persist')
const cleanUp = require('./lib/cleanUp')
const sideload = require('./lib/sideload')
const login = require('./lib/login')
const querystring = require('querystring')
const path = require('path')
const confDir = require('./lib/dirs/configDir')
const open = require('./lib/open')
const systray = require('./lib/systray')

const isStartup = process.env['PMS_STARTUP']

autoLaunch('PimpMyStremio', userConfig.autoLaunch)

let serverPort

async function runServer() {
	const router = express()

	const respond = (res, data) => {
	  if ((data || {}).cacheMaxAge)
	  	res.setHeader('Cache-Control', 'max-age=' + data.cacheMaxAge)
	  res.setHeader('Access-Control-Allow-Origin', '*')
	  res.setHeader('Access-Control-Allow-Headers', '*')
	  res.setHeader('Content-Type', 'application/json')
	  res.send(data)
	}

	const fail = res => {
		res.writeHead(500)
		res.end(JSON.stringify({ err: 'handler error' }))
	}

	router.use(express.static(process.env['PMS_UPDATE'] ? path.join(confDir(), 'assets', 'web') : 'web'))

	router.get('/login-api', (req, res) => {
		const query = req.query || {}
		const method = query.method
		const val = query.val
		if (login[method]) {
			login[method](val).then(resp => {
				respond(res, resp)
			}).catch(err => {
				console.error(err)
				fail(res)
			})
		} else
			fail(res)
	})

	router.get('/api', (req, res) => {
		const query = req.query || {}
		const method = query.method
		const name = query.name
		const pass = uConfig.readPass()
		if (pass && query.pass != pass) {
			fail(res)
			return
		}
		if (addon[method] && method != 'init') {
			addon[method](addon.getManifest(name), decodeURIComponent(query.payload)).then(resp => {
				respond(res, resp)
			}).catch(err => {
				console.error(err)
				fail(res)
			})
		} else
			fail(res)
	})

	router.get('/catalog.json', (req, res) => {
		const reqHost = req.headers.host
		const host = reqHost ? req.protocol + (reqHost.includes('.serveo.net') ? 's' : '') + '://' + reqHost : false
		addon.getCatalog(host, serverPort).then(resp => {
			respond(res, resp)
		}).catch(err => {
			console.error(err)
			fail(res)
		})
	})

	function getRouter(req, res) {
		const vmAddon = addon.get(req.params.addonName)
		if ((vmAddon || {}).router)
			vmAddon.router(req, res, () => {
				res.statusCode = 404
				res.end()
			})
		else
			fail(res)
	}

	router.get('/:addonName/manifest.json', getRouter)

	router.get('/:addonName/:resource/:type/:id/:extra?.json', getRouter)

	serverPort = await getPort({ port: userConfig.serverPort })

	proxy.createProxyServer(router)

	const server = router.listen(serverPort, () => {

		cleanUp.set(server)

		const url = 'http://127.0.0.1:' + serverPort

		proxy.setEndpoint(url)

		console.log('PimpMyStremio server running at: ' + url)

        if (userConfig.remote)
            tunnel(serverPort, { subdomain: userConfig.subdomain }) 
        else if (!isStartup)
        	open('http://127.0.0.1:' + serverPort)

	})
}

addon.init(runningAddons, () => {
	sideload.loadAll(runServer)
}, cleanUp.restart)
