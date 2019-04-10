
const httpProxy = require('http-proxy')
const httpsAgent = require('https').globalAgent
const pUrl = require('url')

const defaultAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/610.0.3239.132 Safari/537.36'

const proxies = {}

let endpoint

function getDirPath(path) {
	let dirPath

	if (path.includes('/'))
		dirPath = path.substr(0, path.lastIndexOf('/') + 1)

	return dirPath
}

const proxify = {

	setEndpoint: url => {
		endpoint = url
	},

	getEndpoint: () => {
		return endpoint
	},

	addProxy: (url, opts) => {
		const urlParser = pUrl.parse(url)

		const host = urlParser.host

		const result = endpoint + '/video-proxy/' + urlParser.host + (urlParser.path || '')

		const path = urlParser.path

		const dirPath = getDirPath(path)

		if (proxies && proxies[host]) {
			proxies[host].paths[path] = opts
			if (dirPath && !proxies[host].paths[dirPath])
				proxies[host].paths[dirPath] = opts
			return result
		}

		proxies[host] = {
			host,
			protocol: urlParser.protocol,
			opts,
			paths: {}
		}

		proxies[host].paths[path] = opts

		if (dirPath && !proxies[host].paths[dirPath])
			proxies[host].paths[dirPath] = opts

		return result
	},

	createProxyServer: router => {

		const proxy = httpProxy.createProxyServer()

		proxy.on('error', e => {
			if (e) {
				console.error('http proxy error')
				console.error(e)
			}
		})

		router.all('/video-proxy/*', (req, res) => {

			var parts = req.url.split('/')

			var host = parts[2]

			parts.splice(0, 3)

			req.url = '/'+parts.join('/')

			let configProxy = {}

			if (proxies[host]) {
				const config = proxies[host]

				configProxy = { target: config.protocol+'//'+config.host }

				configProxy.headers = {
					host: config.host,
					agent: defaultAgent,
				}

				req.headers['host'] = configProxy.headers.host
				req.headers['user-agent'] = configProxy.headers.agent

				const opts = config.paths[req.url] || config.paths[getDirPath(req.url)] || config.opts || {}

				if (opts.headers)
					for (let key in opts.headers)
						configProxy.headers[key] = req.headers[key] = opts.headers[key]

				if (config.protocol == 'https:')
					configProxy.agent = httpsAgent

				res.setHeader('Access-Control-Allow-Origin', '*')

			}

			proxy.web(req, res, configProxy)

		})

		return true
	},

	addAll: streams => {

        return (streams || []).map(stream => { stream.url = proxify.addProxy(stream.url); return stream })

    }
}

module.exports = proxify
