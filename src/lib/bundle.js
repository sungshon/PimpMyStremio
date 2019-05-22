const webpack = require('webpack')

require('source-map-support').install({ environment: 'node', hookRequire: true, handleUncaughtExceptions: true })

module.exports = (name, entry, dest, excluded, isVerbose) => {
	return new Promise((resolve, reject) => {
		const opts = {
		  entry,
		  target: 'node',
		  externals: [
		  	function(context, request, callback) {
		        if (excluded.includes(request))
		            return callback(null, "commonjs " + request)
		        callback()
		    }
		  ],
		  output: {
		    library: name,
		    libraryTarget: 'umd',
		    filename: 'pms.bundle.js',
		    path: dest
		  },
		}

		if (isVerbose) {
			opts.output.filename = 'pms.bundle.verbose.js'
			opts.devtool = 'inline-source-map'
		}

		webpack(opts).run((err, stats) => {
		  if (err || stats.hasErrors()) {
		  	if (err)
			  	console.log(err)
			else {
				if ((((stats || {}).compilation || {}).errors || []).length)
					stats.compilation.errors.forEach(err => {
						console.log(err)
					})
				else
					console.log('PimpMyStremio - Unknown bundling error for module: ' + name)
			}
		  	reject({ errors: true })
		  	return
		  }
		  resolve({ success: true })
		})
	})
}
