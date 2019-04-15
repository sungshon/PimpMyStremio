const webpack = require('webpack')

module.exports = (name, entry, dest, excluded) => {
	return new Promise((resolve, reject) => {
		webpack({
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
		  }
		}).run((err, stats) => {
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