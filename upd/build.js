
var isWin = process.platform === 'win32'

const fs = require('fs')
const path = require('path')

const pmsDir = path.join(__dirname, '..', 'PimpMyStremio')

if (!fs.existsSync(pmsDir))
	fs.mkdirSync(pmsDir)

function ext() {
	return (isWin ? '.exe' : '')
}

const { exec } = require('pkg')

exec(['package.json', '--target', 'host', '--output', '../PimpMyStremio/PimpMyStremio' + ext()])
