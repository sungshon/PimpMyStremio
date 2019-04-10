const AutoLaunch = require('auto-launch')

module.exports = (appName, shouldRun) => {
	const execPath = process.env['PMS_UPDATE'] || process.execPath

	const autoLauncher = new AutoLaunch({
		name: appName,
		path: execPath,
		extraArgs: '--startup'
	})

	autoLauncher.isEnabled()
	.then(isEnabled => {
		if (isEnabled && !shouldRun)
			autoLauncher.disable()
		else if (!isEnabled && shouldRun)
			autoLauncher.enable()
	})
	.catch(err => {
		console.log('Auto Launch Error:')
		console.log(err)
	})
}
