
// sets a process env variable that is available only if the app is packaged

process.env['PMS_PACKAGED'] = '1'

require('./index.js')
