
module.exports = persist => {
	function Storage() {}

	const opts = {
		key: 'ds-',
		methods: ['getItem', 'setItem', 'removeItem', 'clear']
	}

	opts.methods.forEach(method => {
		Storage.prototype[method] = (key, val) => { return persist[method](key ? opts.key + key : undefined, val) }
	})

	return Storage
}
