const fs = require('fs')
const path = require('path')
const configDir = require('./dirs/configDir')()
const phantomPath = path.join(configDir, 'assets', 'phantom')

const phantom = require(fs.existsSync(phantomPath) ? phantomPath : 'phantom')

const defaultClArgs = ["--ignore-ssl-errors=true", "--web-security=false", "--ssl-protocol=tlsv1", "--load-images=false", "--disk-cache=true"]

module.exports = {
	load: (opts, clArgs, opts2, cb) => {
		var phInstance

		opts = opts || {}
		clArgs = clArgs || defaultClArgs
		opts2 = opts2 || { logLevel: 'warn' }

		if (!Array.isArray(clArgs)) {
			console.log('PhantomJS error: Client arguments is not an array, using defaults')
			clArgs = defaultClArgs
		}

		if (typeof opts === 'object' && opts !== null) {
			// it's an object
		} else {
			console.log('PhantomJS error: First options are not an object, using defaults')
			opts = {}
		}

		if (typeof opts2 === 'object' && opts2 !== null) {
			// it's an object
		} else {
			console.log('PhantomJS error: Second options are not an object, using defaults')
			opts2 = { logLevel: 'warn' }
		}

		phantom.create(clArgs, opts2)
		.then(function(instance) {
			phInstance = instance
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

			cb(phInstance, page)

		}).catch(err => {
	      console.log('Caught PhantomJS Error')
	      console.error(err)
	      cb()
	    })
	},
	close: (instance, page, cb) => {

		setTimeout(function() {

			var end = function() {
				var next = cb = function() {}
				instance.exit().then(cb || next, cb || next)
			}

			page.close().then(end, end)

		})

	}
}
