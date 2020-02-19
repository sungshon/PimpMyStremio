const isAndroid = (process.arch || '').startsWith('arm')

module.exports = {
	isMobile: isAndroid,
	isAndroid: isAndroid,
	isIOS: false
}
