const needle = require('needle')
const fs = require('fs')

const configDir = require('./dirs/configDir')
const path = require('path')
const certFile = path.join(configDir(), 'httpsCert.json')

const opts = require('../options')

let cert = null

function atob(str) {
	return new Buffer(str, 'base64').toString('ascii')
}

function validateCert(ipAddress, newCert) {
	var start = new Date(newCert.start)
	var stop = new Date(newCert.stop)
	var now = new Date()
	if (now < start || now > stop)
		return Promise.reject('Could not get a valid cert')
	if ((newCert.ipAddress || '') != (ipAddress || ''))
		return Promise.reject('Cert not valid for request IP')
	return Promise.resolve(newCert)
}

function newCert(ipAddress) {
	return new Promise((resolve, reject) => {
		needle('post', opts.apiEndpoint, JSON.stringify({ authKey: opts.authKey, ipAddress }), {
			headers: { 'Content-Type': 'application/json' },
			json: true
		}).then(async (resp) => {
			const body = (resp ||{}).body
			if ((body || {}).result) {
				var json = body
				var certResp = JSON.parse(json.result.certificate);
				const data = {
					domain: ipAddress.replace(/\./g, '-') + certResp.commonName.replace('*', ''),
					key: atob(certResp.contents.PrivateKey),
					cert: atob(certResp.contents.Certificate),
					start: certResp.contents.NotBefore,
					stop: certResp.contents.NotAfter,
					ipAddress,
				}

				let newCert

				try {
					newCert = await validateCert(ipAddress, data)
				} catch(e) {
					reject(e)
					return
				}

				fs.writeFile(certFile, JSON.stringify(newCert), err => {
					if (err) {
						reject(err)
						return
					}
					cert = newCert
					resolve(newCert)
				})

			} else
				reject(Error('Unexpected body from HTTP request'))
		})
	})
}

function getCert(ipAddress) {
	return new Promise((resolve, reject) => {
		if (cert) {
			resolve(cert)
			return
		}
		fs.readFile(certFile, (err, jsonCert) => {
			if (err) {
				reject(err)
				return
			}
			cert = JSON.parse(jsonCert)
			resolve(cert)
		})
	}).catch(() => {
		return Promise.reject('Could not get a valid Cert')
	}).then(validateCert.bind(null, ipAddress))
}

module.exports = ipAddress => {
	if (!opts.authKey || !opts.apiEndpoint)
		return Promise.reject('HTTPS not available in Development Mode')
	return getCert(ipAddress).catch(certError => {
		if (ipAddress)
			return newCert(ipAddress)
		else
			return Promise.reject(certError)
	})
}
