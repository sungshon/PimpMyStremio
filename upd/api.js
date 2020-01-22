const http = require('http')
const querystring = require('querystring')
const getPort = require('get-port')
const opn = require('open')
const openLinux = require('./openLinux')

const atStartup = (process.argv || []).some(el => !!(el == '--startup'))

let server

let msg

module.exports = {
	start: () => {
		getPort().then(port => {

			server = http.createServer((req, res) => {
			  res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' })
			  res.write(msg)
			  res.end()
			})
			server.listen(port, 'localhost', err => {
			  let url = 'https://sungshon.github.io/PimpMyStremio/'
			  url += '?port=' + port
			  if (!atStartup)
				opn(url, { wait: true }).catch((e) => {
					if (process.platform == 'linux')
						openLinux(url)
					else {
						console.log('Non-critical: Could not auto-open webpage, presuming Linux OS')
						console.error(e)
					}
				})
			})

		}).catch(err => {
			console.log('PimpMyStremio - Could not get port')
		})
	},
	msg: str => {
		msg = str
	},
	getMsg: () => {
		return msg
	},
	close: () => {
		if (server)
			server.close()
	}
}
