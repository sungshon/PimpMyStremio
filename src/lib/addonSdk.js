const Router = require('router')
const qs = require('querystring')
const cors = require('cors')

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}

module.exports = {
	addonBuilder: function addonBuilder(manifest) {
		const resources = ['stream', 'meta', 'catalog', 'subtitles']
		const handlers = {}
		resources.forEach(res => {
			this['define' + capitalizeFirstLetter(res) + 'Handler'] = cb => { handlers[res] = cb }
		})
		this.handler = args => {
			if (handlers[args.resource])
				return handlers[args.resource](args)
			else
				return Promise.reject('Resource unsupported')
		}
		this.getInterface = () => {
			return {
				handler: this.handler,
				manifest: this.manifest
			}
		}
		this.manifest = manifest
		return this
	},
	getInterface: builder => {
		// keeping for reverse compatibility
		return builder.getInterface()
	},
	getRouter: ({ handler, manifest }) => {
		const router = new Router()

		router.use(cors())

		const manifestBuf = JSON.stringify(manifest)
		function manifestHandler(req, res) {
			res.setHeader('Content-Type', 'application/json; charset=utf-8')
			res.end(manifestBuf)
		}
		router.get('/:addonName/manifest.json', manifestHandler)

		router.get('/:addonName/:resource/:type/:id/:extra?.json', (req, res, next) => {
			const { resource, type, id } = req.params
			const extra = req.params.extra ? qs.parse(req.params.extra) : {}
			const args = { resource, type, id, extra }
			handler(args)
				.then(resp => {
					if (resp.cacheMaxAge) res.setHeader('Cache-Control', 'max-age='+resp.cacheMaxAge)
					res.setHeader('Content-Type', 'application/json; charset=utf-8')
					res.end(JSON.stringify(resp))
				})
				.catch(err => {
					if (err.noHandler) {
						if (next) next()
						else {
							res.writeHead(404)
							res.end('Cannot GET ' + req.url)
						}
					} else {
						console.error(err)
						res.writeHead(500)
						res.end(JSON.stringify({ err: 'handler error' }))
					}
				})
		})
		return { router, manifest }
	}
}
