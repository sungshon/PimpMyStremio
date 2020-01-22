
const httpProxy = require('http-proxy')
const httpsAgent = require('https').globalAgent
const needle = require('needle')
const subsrt = require('subsrt')
const encoding = require("encoding")
const jschardet = require("jschardet")
const pUrl = require('url')
const events = require('./events')

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
		events.emit('set-endpoint-children', endpoint)
	},

	getEndpoint: () => {
		return endpoint
	},

	addProxy: (url, opts) => {

		const urlParser = pUrl.parse(url)

		const host = urlParser.host

		const result = endpoint + '/video-proxy/' + urlParser.host + (urlParser.path || '')

		if (process.send) {
			// is child
			process.send({ proxy: true, url, opts })
			return result
		}

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

		const proxy = httpProxy.createProxyServer({ secure: false, followRedirects: true })

		proxy.on('error', e => {
			if (e) {
				console.error('http proxy error')
				console.error(e)
			}
		})

		proxy.on('proxyRes', (proxyRes, request, response) => {
			proxyRes.headers['Access-Control-Allow-Origin'] = '*'
		})

		router.all('/video-proxy/*', (req, res) => {
			var parts = req.url.split('/')

			var host = parts[2]

			parts.splice(0, 3)

			req.url = '/'+parts.join('/')

			let configProxy = {}
			let opts = {}
			let config = {}

			if (proxies[host]) {
				config = proxies[host]

				configProxy = { target: config.protocol+'//'+config.host }

				configProxy.headers = {
					host: config.host,
					agent: defaultAgent,
				}

				req.headers['host'] = configProxy.headers.host
				req.headers['user-agent'] = configProxy.headers.agent

				opts = config.paths[req.url] || config.paths[getDirPath(req.url)] || config.opts || {}

				if (opts.headers)
					for (let key in opts.headers)
						configProxy.headers[key] = req.headers[key] = opts.headers[key]

				if (config.protocol == 'https:')
					configProxy.agent = httpsAgent

				res.setHeader('Access-Control-Allow-Origin', '*')
			}
			if (!configProxy.target) {
				res.writeHead(500)
				res.end(JSON.stringify({ err: 'handler error' }))
			} else {
				if (opts.playlist || opts.subtitle) {
					needle.get(config.protocol + '//' + config.host + req.url, { follow_max: 5, headers: opts.headers || req.headers }, (err, resp, body) => {
						if (!err && body) {
							body = Buffer.isBuffer(body) ? body.toString() : body
							if (opts.playlist) {
								const newPlaylist = []
								let newOpts = JSON.parse(JSON.stringify(opts))
								delete newOpts.playlist
								body.split(/\r?\n/).forEach(line => {
									if (line.startsWith('http://') || line.startsWith('https://')) {
										if (newOpts.noFollowSegment)
											newPlaylist.push(line)
										else
											newPlaylist.push(proxify.addProxy(line, newOpts))
									} else if (line.match(/URI="([^"]+)/)) {
										const nUrl = line.match(/URI="([^"]+)/)
										let oldUrl
										if ((nUrl || []).length > 1) oldUrl = nUrl[1]
										let newUrl = oldUrl
										if (newUrl.startsWith('/'))
											newUrl = proxies[host].protocol + '//' + proxies[host].host + newUrl
										else if (!newUrl.startsWith('http'))
											newUrl = proxies[host].protocol + '//' + proxies[host].host + '/' + newUrl
										newPlaylist.push(oldUrl ? line.replace(oldUrl, proxify.addProxy(newUrl, newOpts)) : line)
									} else
										newPlaylist.push(line)
								})
								res.end(newPlaylist.join('\n'))
							} else if (opts.subtitle) {
								let newSub = body
								if (opts.subtitle.convert)
									try {
										newSub = subsrt.convert(newSub, { format: 'srt' })
									} catch(e) {
										console.log('convert subtitle to srt error:')
										console.error(e)
									}
								if (opts.subtitle.encodeUtf8) {
									if (!opts.subtitle.encoding || typeof opts.subtitle.encoding !== 'string') {
										opts.subtitle.encoding = (jschardet.detect(newSub) || {}).encoding
										console.log('guessed encoding for subtitle: ' + opts.subtitle.encoding)
									}
									newSub = encoding.convert(newSub, 'UTF-8', opts.subtitle.encoding)
								}
								res.setHeader('Content-Type', 'text/plain; charset=utf-8')
								res.end(newSub)
							}
						} else {
							console.log('Error while requesting: ' + req.url)
							if (err)
								console.error(err)
							res.writeHead(500)
							res.end(JSON.stringify({ err: 'handler error' }))
						}
					})
				} else {
					proxy.web(req, res, configProxy)
				}
			}

		})

		return true
	},

	addAll: streams => {

        return (streams || []).map(stream => { stream.url = proxify.addProxy(stream.url); return stream })

    }
}

module.exports = proxify
