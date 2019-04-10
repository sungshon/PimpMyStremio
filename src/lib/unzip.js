const nodeZip = require('node-zip')
const path = require('path')
const fs = require('fs')

module.exports = {
	extract: (data, dest) => {
		const zip = new nodeZip(data, { base64: true })
		for (filePath in zip.files) {
			const file = zip.files[filePath]
			if (!file.dir) {
				const fileParts = filePath.split('/')
				let filename
				let lastDir
				if (fileParts.length > 2) {
					fileParts.shift() // ignore initial directory
					lastDir = dest
					fileParts.forEach((part, idx) => {
						if (idx == fileParts.length -1)
							filename = part
						else {
							lastDir = path.join(lastDir, part)
							if (!fs.existsSync(lastDir))
								fs.mkdirSync(lastDir)
						}
					})
				} else
					filename = fileParts[fileParts.length -1]
				fs.writeFileSync(path.join(lastDir || dest, filename), file._data.getContent())
			}
		}
		return true
	}
}
