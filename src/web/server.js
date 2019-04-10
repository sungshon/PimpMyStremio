
import child from 'child_process'
import _ from 'lodash'
import ports from 'get-ports'
import opn from 'opn'
import helpers from '../helpers'
import requests from '../helpers/requests'

var isWin = process.platform === 'win32'

var addons = {
	'movies-series': {
//		'Paid Movies & Series': {
//			addonType: 'addon',
//			addonNames: ['reelgood.com']
//		},
		'Free Movies & Series': {
			addonType: 'addon',
			addonNames: ['fmovies.cloud', '123moviestime.com', '123movies.fm']
		},
		'Free Movies': {
			addonType: 'vodlockerAddon',
			addonNames: ['vodlocker.to']
		},
	},
	'porn': {
		'Porn Videos': {
			addonType: 'pornAddon',
			addonNames: ['pornhub', 'redtube', 'tube8', 'youporn', 'spankwire']
		},
	},
	'cartoons': {
		'Free Cartoons': {
			addonType: 'miscAddon cartoon',
			addonNames: ['123movies.fm']
		},
	},
	'anime': {
		'Free Anime': {
			addonType: 'miscAddon anime',
			addonNames: ['123movies.fm', 'animehub.ac', 'animeheaven.eu']
		},
	},
	'asian': {
		'Free Asian Drama': {
			addonType: 'miscAddon asianDrama',
			addonNames: ['123movies.fm']
		},
	},
	'music': {
		'Free Music': {
			addonType: 'mp3clanAddon',
			addonNames: ['mp3clan']
		},
		'Free Radios': {
			addonType: 'radioAddon',
			addonNames: ['tunein.com']
		},
	},
	'iptv': {
		'Free IPTV Wordwide': {
			addonType: 'firstonetvAddon',
			addonNames: ['firstonetv.net']
		},
		// 'Free IPTV United States': {
		// 	addonType: 'iptvAddon',
		// 	addonNames: ['GratisIPTV-US', 'FilmoverIPTV-US']
		// },
		// 'Free IPTV United Kingdom': {
		// 	addonType: 'iptvAddon',
		// 	addonNames: ['GratisIPTV-UK', 'FilmoverIPTV-UK']
		// },
		// 'Free IPTV Canada': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-CA', 'FilmoverIPTV-CA']
		// },
		// 'Free IPTV Bulgaria': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-BG', 'FilmoverIPTV-BG']
		// },
		// 'Free IPTV Romania': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-RO', 'FilmoverIPTV-RO']
		// },
		// 'Free IPTV France': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-FR', 'FilmoverIPTV-FR']
		// },
		// 'Free IPTV Portugal': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-PT', 'FilmoverIPTV-PT']
		// },
		// 'Free IPTV Netherlands': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-NL', 'FilmoverIPTV-NL']
		// },
		// 'Free IPTV Spain': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-ES', 'FilmoverIPTV-ES']
		// },
		// 'Free IPTV Germany': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-DE', 'FilmoverIPTV-DE']
		// },
		// 'Free IPTV Italy': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-IT', 'FilmoverIPTV-IT']
		// },
		// 'Free IPTV Denmark': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-DEN']
		// },
		// 'Free IPTV Sweeden': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-SE']
		// },
		// 'Free IPTV Switzerland': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-CH', 'FilmoverIPTV-CH']
		// },
		// 'Free IPTV Turkey': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-TR', 'FilmoverIPTV-TR']
		// },
		// 'Free IPTV Albania': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-AL', 'FilmoverIPTV-AL']
		// },
		// 'Free IPTV Scandinavia': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-SC', 'FilmoverIPTV-SC']
		// },
		// 'Free IPTV Arab Countries': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-SA']
		// },
		// 'Free IPTV Russia': {
		// 	addonType: 'iptvAddon', addonNames: ['FilmoverIPTV-RU']
		// },
		// 'Free IPTV Sport': {
		// 	addonType: 'iptvAddon', addonNames: ['GratisIPTV-SP', 'FilmoverIPTV-SP']
		// },
	}
}

var isIptv

var runningAddons = {}

var manifestsMap = require('../addon/manifests')

var manifestData = (addonName, addonType) => {

	var manifestDt = { addonName, addonType }

	var type = addonType.startsWith('miscAddon ') ? addonType.replace('miscAddon ', '') : false

	var manifest = manifestsMap[addonName]

	if (type && manifest.alternatives)
		manifest = manifest.alternatives[type]

	manifestDt.name = manifest.name
	manifestDt.logo = manifest.logo
	manifestDt.description = manifest.description
	manifestDt.id = manifest.id

	return manifestDt
}

var supportedAddons = []

var getPort = (cb) => {
	var randomPort = 8000 + Math.floor(Math.random()*2000)
	ports([randomPort], function(err, port) {
		cb(port && port[0] ? port[0] : false)
	})
}

var toggleAddon = (addonName, addonType) => {
	_.each(supportedAddons, (el, ij) => {
		_.each(el, (elm, ijm) => {
			if (elm.addonName == addonName && elm.addonType == addonType) {
				if (!elm.running)
					startAddon(addonName, addonType, ij, ijm)
				else
					stopAddon(addonName, addonType)
			}
		})
	})
}

var webServer = () => {
	getPort((port) => {

		var serverUrl

		var serverPort = process.env.MASTERPORT || port

		var http = require("http"),
			url = require("url"),
			path = require("path"),
			fs = require("fs")

		var proxy = require('http-proxy').createProxyServer()

		proxy.on('error', function(e) {
			if (e) {
				console.log('http proxy error')
				console.log(e)
			}
		})

		http.createServer(function(req, resp) {

		  var page404 = () => {
			resp.writeHead(404, { "Content-Type": "text/plain" });
			resp.write("404 Not Found\n");
			resp.end();
		  }

		  var page500 = () => {
			resp.writeHead(500, { "Content-Type": "text/plain" })
			resp.write(err + "\n")
			resp.end()
		  }

		  var uri = url.parse(req.url).pathname

		  if (uri.startsWith('/addon-proxy')) {
		  	var parts = url.parse(req.url).path.split('/')
		  	var targetId = parts[2]

			parts.splice(0, 3)

			req.url = '/' + parts.join('/')

		  	// find requested add-on

			var foundPort = _.some(supportedAddons, (el, ij) => {
				return _.some(el, (elm, ijm) => {
					if (elm.running && elm.id == targetId) {

					  	if (req.url.startsWith('/stream/')) {

					  		var streamObj = { streams: [] }

					  		requests.get({ url: 'http://127.0.0.1:' + elm.port + req.url, json: true }, (e, r, body) => {
				  				if (!e && body && body.streams && body.streams.length) {
				  					streamObj.streams = body.streams.map((stream) => {
				  						if (stream.url.startsWith('http://127.0.0.1')) {
				  							var streamParts = stream.url.split('/')
				  							streamParts.splice(0, 3)
				  							stream.url = serverUrl + '/addon-proxy/' + targetId + '/' + streamParts.join('/')
				  						}
				  						return stream
				  					})
				  				}
				  				var streamResp = JSON.stringify(streamObj)
			  					resp.writeHead(200, {
			  						"Content-Type": "application/json; charset=utf-8",
			  						"Content-Length": streamResp.length,
			  						"Access-Control-Allow-Origin": "*"
			  					})
			  					resp.write(streamResp)
			  					resp.end()
				  			})

					  	} else {

							var configProxy = {
								target: 'http://127.0.0.1:' + elm.port,
								headers: { host: '127.0.0.1' }
							}

							resp.setHeader('Access-Control-Allow-Origin', '*')

							proxy.web(req, resp, configProxy)

						}

						return true

					}
				})
			})

			if (!foundPort)
				page404()

		  	return
		  }

		  if (uri == '/setReqUrl') {
		  	serverUrl = decodeURIComponent(url.parse(req.url, true).query.url)
			resp.writeHead(200, {});
			resp.write("{}", "binary");
			resp.end();
		  	return
		  }

		  if (uri == '/set') {
		  	var type = url.parse(req.url, true).query.type

		  	supportedAddons = addons[type]

			// attach manifest data to supported addons
			_.each(supportedAddons, (thisAddon, ij) => {
				if (thisAddon.addonNames) {
					var manifests = []
					thisAddon.addonNames.forEach((thisAddonName) => {
						manifests.push(manifestData(thisAddonName, thisAddon.addonType))
					})
					supportedAddons[ij] = manifests
				}
			})

			isIptv = !!(type == 'iptv')

			resp.writeHead(200, {});

			resp.write("{}", "binary");
			resp.end();

		  	return
		  }

		  if (uri == '/collection.json') {
		  	resp.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
		  	const ports = []
	  		_.each(supportedAddons, (el, ij) => {
				_.each(el, (elm, ijm) => {
					if (elm.running && elm.port)
						ports.push(elm.port)
				})
			})
		  	if (!ports.length) {
		  		resp.write("[]", "binary");
			  	resp.end()
		  	} else {
		  		const manifests = []
		  		const tick = helpers.setTicker(ports.length, () => {
		  			resp.write(manifests.length ? JSON.stringify(manifests) : "[]", "binary")
				  	resp.end()
		  		})
		  		ports.forEach((el) => {
		  			const manifestUrl = 'http://127.0.0.1:' + el + '/manifest.json'
		  			requests.get({ url: manifestUrl, json: true }, (err, resp, body) => {
		  				if (!err && body) {
		  					manifests.push({
		  						transportUrl: 'http://127.0.0.1:' + serverPort + '/addon-proxy/' + body.id + '/manifest.json',
		  						transportName: 'http',
		  						manifest: body
		  					})
		  				}
		  				tick()
		  			})
		  		})
		  	}
		  	return
		  }

		  if (uri == '/data') {
			resp.writeHead(200, {});

			resp.write(JSON.stringify(supportedAddons), "binary");
			resp.end();

		  	return
		  }

		  if (uri == '/isIptv') {
			resp.writeHead(200, {});

			resp.write(isIptv ? '1' : '0', "binary");
			resp.end();

		  	return
		  }

		  if (uri.startsWith('/toggle')) {

		  	var parts = url.parse(req.url).search.replace('?addonName=', '').split('&addonType=')

		  	var addonName = parts[0]
		  	var addonType = parts[1].replace('%20', ' ')

			toggleAddon(addonName, addonType)

			resp.writeHead(200, {});

			resp.write(JSON.stringify({}), "binary");
			resp.end();

		  	return
		  }

//		  if (uri != '/')
//			return page404()

		  var contentTypesByExtension = {
		    '.html': "text/html",
		    '.css':  "text/css",
		    '.js':   "text/javascript",
		    '.png': "image/png"
		  };

		  if (uri == '/') uri += 'index.html'

		  var filename = path.join(process.cwd(), 'web' + uri)

		  fs.exists(filename, function(exists) {

			if (!exists)
				return page404()

			fs.readFile(filename, "binary", function(err, file) {

				if (err)
					return page500()

				var headers = {}
				var contentType = contentTypesByExtension[path.extname(filename)]

				if (contentType) headers["Content-Type"] = contentType

				resp.writeHead(200, headers);

				resp.write(file, "binary");
				resp.end();

		    })
		  })
		}).listen(serverPort, () => {
			var localLink = 'http://127.0.0.1:'+port+'/'
			console.log('Server started at: ' + localLink)
			opn(localLink)
		})
	})
}

var startAddon = (addonName, addonType, addonId, addonManifestId) => {

	getPort((port) => {
		var newEnv = JSON.parse(JSON.stringify(process.env))
		newEnv.PORT = port

		var addonProc = child.spawn('npm' + (isWin ? '.cmd' : ''), ['start', addonName].concat(addonType.split(' ')),
			{
				cwd: process.cwd(),
				env: newEnv
			})

		if (!runningAddons[addonName])
			runningAddons[addonName] = { types: {} }

		runningAddons[addonName].types[addonType] = {
			proc: addonProc
		}

		var setAttr = (attr, value) => {
			supportedAddons[addonId][addonManifestId][attr] = value
		}

		var hasAttr = (attr, value) => {
			return !!(supportedAddons[addonId][addonManifestId][attr] == value)
		}

		setAttr('port', port)
		setAttr('running', true)
		setAttr('status', 'Starting')

		addonProc.stdout.on('data', (data) => {
			if (data) {
				var sData = String(data).replace(/(\r\n\t|\n|\r\t)/gm,'')
				if (sData.includes('[updating]'))
					setAttr('status', 'Updating')
				else if (sData.includes('[updated]'))
					setAttr('status', 'Active')
			}
		})

		addonProc.stderr.on('data', (data) => {
//			console.log(String(data))
//			setAttr('port', false)
//			setAttr('running', false)
//			setAttr('status', 'Error')
		})

		addonProc.on('exit', (code) => {
			setAttr('port', false)
			setAttr('running', false)
			setAttr('status', 'Stopped')
		})
	})
}

var stopAddon = (addonName, addonType) => {
	if (runningAddons[addonName] && runningAddons[addonName].types[addonType]) {
		runningAddons[addonName].types[addonType].proc.kill('SIGINT')
	}
}

webServer()
