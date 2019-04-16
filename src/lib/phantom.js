const fs = require('fs')
const path = require('path')
const configDir = require('./dirs/configDir')()
const phantomPath = path.join(configDir, 'assets', 'phantom')

const phantom = require(fs.existsSync(phantomPath) ? phantomPath : 'phantom')

const defaultClArgs = ["--ignore-ssl-errors=true", "--web-security=false", "--ssl-protocol=tlsv1", "--load-images=false", "--disk-cache=true"]

module.exports = {
	load: (opts, clArgs, opts2, cb) => {
		let instance

		opts = opts || {}
		clArgs = clArgs || defaultClArgs
		opts2 = opts2 || { logLevel: 'warn' }

		function warn(msg) { console.log('PhantomJS warning: ' + msg + ', using defaults') }

		if (!Array.isArray(clArgs)) {
			clArgs = defaultClArgs; warn('Client arguments is not an array')
		}

		if (typeof opts === 'object' && opts !== null) { // it's an object
		} else {
			opts = {}; warn('First options are not an object')
		}

		if (typeof opts2 === 'object' && opts2 !== null) { // it's an object
		} else {
			opts2 = { logLevel: 'warn' }; warn('Second options are not an object')
		}

		phantom.create(clArgs, opts2)
		.then(function(phInstance) {
			instance = phInstance
			return instance.createPage()
		})
		.then(function(page) {

// this breaks phantomjs responses for some reason:

//			if (!opts.timeout)
//				opts.timeout = 15000 // default timeout of 15 secs

//			page.property('settings', { resourceTimeout: opts.timeout })

			if (opts.clearMemory)
				page.invokeMethod('clearMemoryCache')

			if (opts.headers)
				page.property('customHeaders', opts.headers)

			if (opts.agent)
				page.setting('userAgent', opts.agent)

			if (opts.noRedirect)
				page.property('navigationLocked', true)

//			page.on('onResourceTimeout', function() {
//				console.log('Page Timed Out')
//			})

			cb(instance, page)

		}).catch(err => {
	      console.log('PhantomJS - Caught Error')
	      console.error(err)
	      cb()
	    })
	},
	close: (instance = {}, page = {}, cb = (() => {})) => {

		let err

		if (!instance.exit)
			err = Error('PhantomJS - Cannot close, missing instance')

		if (!page.close)
			err = Error('PhantomJS - Cannot close, missing page')

		if (err) {
			console.error(err)
			cb(err)
			return
		}

		setTimeout(() => {
			const exit = () => { instance.exit().then(cb, cb) }
			page.close().then(exit, exit)
		})

	}
}
