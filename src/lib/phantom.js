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

		let onceCb

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

			function end(myPage) {
				onceCb = true
				cb(instance, myPage || page)
			}

			if (!opts.polyfill)
				end()
			else
				injectCoreJs(instance, page, end)

		}).catch(err => {
	      console.log('PhantomJS - Caught Error')
	      console.error(err)
	      if (!onceCb)
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

function injectCoreJs(instance, page, cb) {
	// we'll hack our way to glory here
	// by injecting core.js into phantomjs
	// to support ES 5/6

	const myPage = {}
	let pageChanged

	for (let key in page) {
		if (typeof page[key] === 'function') {
			if (key == 'open')
				myPage[key] = (a,b,c,d) => {
					return new Promise((resolve, reject) => {

						page.on('onLoadFinished', async status => {
							if (pageChanged) {
								const body = await page.property('content')
								resolve(status, body)
							}
						})

						let once

						page.on('onInitialized', function() {
						  if (once) return

						  once = true

						  page.evaluate(function() {

						  	var script = document.createElement('script')
							script.type = 'text/javascript'
							script.src = 'https://unpkg.com/core-js-bundle/minified.js'
							script.async = false

							var parent = document.getElementsByTagName('head')[0]

							parent.insertBefore(script, parent.firstChild)
							return true
						  }).then(async resp => {
						  	const pgContent = await page.property('content')
						  	const pgUrl = await page.property('url')
						  	page.setContent(pgContent, pgUrl)
						  	pageChanged = true
						  }).catch(e => {
						  	console.log('err')
						  	reject(e)
						  })
						})

						page.open(a,b,c,d).then(() => {
							// ignore this.. it's useless in this case
						}).catch(e => {
							reject(e)
						})
					})
				}
			else
				myPage[key] = (a,b,c,d) => { return page[key](a,b,c,d) }
		}
	}

	myPage['on'] = (a,b) => {
		page.on(a, (c,d,e,f) => { if (pageChanged) b(c,d,e,f) })
	}

	const extras = ['property']

	extras.forEach(key => {
		myPage[key] = (a,b) => { return page[key](a,b) }
	})

	cb(myPage)
}
