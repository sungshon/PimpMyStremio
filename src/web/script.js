

function repoName(repo) {
	return repo == '_pimpmystremio' ? repo : repo.split('/')[1].split('#')[0]
}

function request(method, name, payload, cb) {
	$.get('api?pass=' + (localStorage.password || '') + '&method=' + method + '&name=' + name + '&payload=' + payload, cb)
}

function isSearch() { return !$('#searchResults').is(':empty') }

function getFunction() { return isSearch() ? search : updateView }

function install(repo) {
	const name = repoName(repo)
	const fn = getFunction()
	fn(() => {
		componentHandler.upgradeAllRegistered()
		request('install', name, '', () => { updateView(search) })
	}, repo)
}

function forceStart(repo) {
	request('run', repoName(repo), '', () => { updateView(search) })
}

function start(repo, repoTitle) {
	getFunction()(() => {
		componentHandler.upgradeAllRegistered()
		request('defaultConfig', repoName(repo), '', defaultConfig => {
			let hasRequired = false
			for (let key in defaultConfig)
				if (defaultConfig[key].required)
					hasRequired = true

			if (!hasRequired)
				forceStart(repo)
			else {
				request('addonConfig', repoName(repo), '', addonConfig => {
					let missingConfig = false
					for (let key in defaultConfig)
						if (defaultConfig[key].required && !addonConfig[key])
							missingConfig = true

					if (!missingConfig)
						forceStart(repo)
					else
						settings(repo, '!!! Missing required settings !!!')

				})
			}
		})
	}, repo)
}

function stop(repo) {
	request('stop', repoName(repo), '', () => { updateView(search) })
}

function getUrl(stremioLink) {
	return (stremioLink ? 'stremio:' : window.location.protocol) + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '')
}

function isLocal() {
	return !!(['127.0.0.1', 'localhost'].indexOf(window.location.hostname) > -1)
}

function onImgLoad(selector, callback) {
    $(selector).each(() => {
        if (this.complete || $(this).height() > 0)
            callback.apply(this)
        else
            $(this).on('load', () => { callback.apply(this) })
    })
}

function loadQr(path) {
	dialog.close()
	let str = '' +
		'<img class="qrCode" src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=' + getUrl(true) + path + '">' +
		'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised ext" onClick="closeDialog()">' +
			'Close' +
		'</button></div>'
	$('.mdl-dialog').html(str)
	componentHandler.upgradeAllRegistered()
	onImgLoad('.qrCode', () => {
		setTimeout(() => {
			dialog.showModal()
		}, 1000)
	})
}

function external(title, path) {
	path = path || '/catalog.json'
	let str = ''
	if (title) {
		dialog.close()
		str += '<div class="load-title">' + title + '</div>'
	}
	str += '' +
		'<a target="_blank" href="' + getUrl(true) + path + '" class="settingsMainButton"><button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent ext" onClick="loadApp()">' +
			'Load in Stremio App' +
		'</button></a>' +
		'<a target="_blank" href="http://app.strem.io/shell-v4.4/#/?addonOpen=' + encodeURIComponent(getUrl() + path) + '" class="settingsMainButton"><button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent ext" onClick="loadWeb()">' +
			'Load in Stremio Web' +
		'</button></a>'
	if (!isLocal())
		str += '' +
			'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent ext" onClick="loadQr(\'' + path + '\')">' +
				'Load with QR Code' +
			'</button></div>'
	str += '' +
		'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised ext" onClick="closeDialog()">' +
			'Close' +
		'</button></div>'
	$('.mdl-dialog').html(str)
	componentHandler.upgradeAllRegistered()
	dialog.showModal()
}

function closeDialog() {
	dialog.close()
}

function saveSettings(shouldRun, shouldRestart) {
	const obj = objectifyForm($('.settingsForm').serializeArray())
	request('defaultConfig', repoName(obj.repo), '', defaultConfig => {
		for (let key in defaultConfig) {
			if (defaultConfig[key].type == 'number')
				obj[key] = parseInt(obj[key])
			else if (defaultConfig[key].type == 'boolean')
				obj[key] = !!(typeof obj[key] == 'string' ? (obj[key] == 'on') : obj['key'])
		}
		const payload = encodeURIComponent(JSON.stringify(obj))
		request('saveAddonConfig', repoName(obj.repo), payload, jsonData => {
			if (shouldRestart)
				request('restart', '', '', () => {})
			else if (shouldRun)
				start(obj.repo)
			closeDialog()
		})
	})
}

function objectifyForm(formArray) {
	let returnArray = {}
	for (var i = 0; i < formArray.length; i++)
		returnArray[formArray[i]['name']] = formArray[i]['value']
	return returnArray
}

function copyManifestUrl(url) {
  var aux = document.createElement('input')
  aux.setAttribute('value', url)
  document.getElementsByClassName('mdl-dialog')[0].prepend(aux)
  aux.select()
  document.execCommand('copy')
  document.getElementsByClassName('mdl-dialog')[0].removeChild(aux)
  $('#toast')[0].MaterialSnackbar.showSnackbar({ message: 'Copied Add-on URL to Clipboard' })
}

function basicSettings(repo, repoTitle, isRunning) {
	let str = '<center><h4 class="settingsTop">Settings</h4><br/><span class="settingsSub">' + repoTitle + '</span></center>'
	if (repo != '_pimpmystremio') {
		const path = '/' + repoName(repo) + '/manifest.json'
		str += '<div>' +
			'<div class="copy-box" onClick="copyManifestUrl(\'' + window.location.href.slice(0, -1) + path + '\')">Add-on URL (click to copy)</div>' +
			'<button class="mdl-button mdl-js-button mdl-button--raised load-button" onClick="external(\'' + repoTitle + '\', \'' + path + '\')"' + (!isRunning ? ' disabled' : '')  + '>' +
				'Load' +
			'</button>' +
			'</div>'
	}
	return str
}

function searchToggle() {
	if ($('.searchButton').hasClass('mdl-button--colored')) {
		$('.content').hide()
		$('.footer').hide()
		$('.searchContent').show(() => {
			$('#searchResults').show()
			$('#query').focus()
		})
		$('.searchButton').removeClass('mdl-button--colored')
	} else {
		$('#searchResults').hide().empty()
		$('.searchContent').hide(() => {
			$('#query').val('')
		})
		$('.content').fadeIn()
		$('.footer').show()
		$('.searchButton').addClass('mdl-button--colored')		
	}
}

function search(cb, loading) {
	setTimeout(() => {
		const query = $('#query').val()
		if (query.length <= 2)
			$('#searchResults').empty()
		else {
			const results = []
			const allAddons = ((addons || {})['All'] || [])
			allAddons.forEach(el => {
				console.log(el.name.toLowerCase() + ' --- ' + query.toLowerCase())
				if (el.name.toLowerCase().includes(query.toLowerCase()))
					results.push(el)
			})
			if (results.length) {
				let str = ''
				results.forEach(addon => {
					str += addonToRow(lastJsonData, addon, loading)
				})
				$('#searchResults').html('<table class="mdl-data-table mdl-js-data-table">' + str + '</table>')
			} else
				$('#searchResults').empty()
		}
		if (cb) cb()
	})
}

function settings(repo, repoTitle, isRunning) {
	request('addonConfig', repoName(repo), '', addonConfig => {
		if (!Object.keys(addonConfig).length) {
			let str = '<div class="no-setting">' + basicSettings(repo, repoTitle, isRunning)
			str += '<button class="mdl-button mdl-js-button mdl-button--raised" onClick="closeDialog()">Close</button></div>'
			$('.mdl-dialog').html(str)
			componentHandler.upgradeAllRegistered()
	    	dialog.showModal()
		} else {
			request('defaultConfig', repoName(repo), '', defaultConfig => {
				let str = basicSettings(repo, repoTitle, isRunning)
				str += '<form class="settingsForm" action="#">'
				for (let key in defaultConfig) {
					if (['string', 'number'].indexOf(defaultConfig[key].type) > -1) {
						const val = !!addonConfig[key] ? ' value="' + (addonConfig[key] + '').split('"').join('\\"') + '"' : ''
						const isNumber = defaultConfig[key].type == 'number' ? ' pattern="-?[0-9]*(\\.[0-9]+)?"' : ''
						const isRequired = defaultConfig[key].required ? ' required' : ''
						str += '' +
							'<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">' +
							    '<input class="mdl-textfield__input" type="text" id="' + key + '" name="'+key+'"' + val + isNumber + isRequired + '>' +
							    '<label class="mdl-textfield__label" for="' + key + '">' + defaultConfig[key].title + '</label>' +
							    (isNumber ? '<span class="mdl-textfield__error">Input is not a number!</span>' : '') +
							'</div>'
					} else if (defaultConfig[key].type == 'boolean') {
						const isChecked = !!addonConfig[key] ? ' checked' : ''
						str += '' +
							'<label class="mdl-switch mdl-js-switch" for="' + key + '">' +
								'<input type="checkbox" id="' + key + '" class="mdl-switch__input" name="'+key+'"' + isChecked + '>' +
								'<span class="mdl-switch__label">' + defaultConfig[key].title + '</span>' +
							'</label>'
					} else if (defaultConfig[key].type == 'select') {
						const selDefault = addonConfig[key] || defaultConfig[key].default || (defaultConfig[key].options || [])[0]
						str += '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label mdl-select">' +
							'<select class="mdl-textfield__input" id="' + key + '" name="' + key + '">';
						(defaultConfig[key].options || []).forEach(el => {
							str += '<option value="' + el + '"' + (el == selDefault ? ' selected': '') + '>' + el + '</option>'
						})
						str += '</select>' +
							'<label class="mdl-textfield__label" for="' + key + '">' + defaultConfig[key].title + '</label>' +
							'</div>'
					}
				}
				str += '<input type="hidden" name="repo" value="'+repo+'">'
				let buttons = ''
				if (repo != '_pimpmystremio')
					buttons += '' +
							'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent settingsRun" onClick="saveSettings(true)">' +
								'Save and Run' +
							'</button>' +
							'<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent" onClick="saveSettings()">' +
								'Save' +
							'</button></div>'
				else
					buttons += '' +
							'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent settingsRun" onClick="saveSettings(true, true)">' +
								'Save and Restart' +
							'</button>'
				let closeButton = '' +
							'<button class="mdl-button mdl-js-button mdl-button--raised" onClick="closeDialog()">' +
								'Close' +
							'</button>'
				$('.mdl-dialog').html(str + buttons +'</form>' + closeButton)
				$('.settingsForm').on('submit', e => { e.preventDefault() })
				componentHandler.upgradeAllRegistered()
		    	dialog.showModal()
		    	setTimeout(() => {
					document.activeElement.blur()
		    	})
			})
		}
	})
}

function addonToRow(data, addon, loading) {
	let str = '' +
	'<tr>' +
		'<td><div class="imgBox" style="background: url('+addon.logo+') no-repeat center center"></div></td>' +
		'<td class="name">'+addon.name+'</td>' +
		'<td class="desc">'+addon.description+'</td>' +
		'<td class="actions">'

	const isLoading = (loading && loading == addon.repo)

	if (isLoading) {
		str += '<div class="mdl-spinner mdl-js-spinner is-active addon-load"></div>'
	} else {
		const isInstalled = data.installedAddons.some(installedAddon => {
			if (addon.repo == installedAddon.repo)
				return true
		})

		if (isInstalled) {
			let isRunning = true
			if (addon.sideloaded)
				isRunning = addon.running
			else
				isRunning = addon.sideloaded && addon.running || (data.runningAddons || []).some(runningAddon => {
					if (addon.repo == runningAddon.repo)
						return true
				})
			str += '' +
				'<button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab toggle" onClick="' + (isRunning ? 'stop' : 'start') + '(\''+addon.repo+'\', \''+addon.name+'\')">' +
					'<i class="material-icons">' + (isRunning ? 'pause' : 'play_arrow') + '</i>' +
				'</button>' +
				'<button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab" onClick="settings(\''+addon.repo+'\', \''+addon.name+'\', ' + isRunning.toString() + ')">' +
					'<i class="material-icons">settings</i>' +
				'</button>'
		} else
			str += '' +
				'<button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab" onClick="install(\''+addon.repo+'\')">' +
					'<i class="material-icons">get_app</i>' +
				'</button>'
	}

	str += '' +
		'</td>' +
	'</tr>'

	return str
}

let addons = {}
let lastJsonData = {}

function updateView(cb, loading) {
	request('getAll', '', '', jsonData => {

		if (jsonData && jsonData.allAddons) {
			lastJsonData = jsonData
			addons = { 'All': [] }
			const types = ['All']
			jsonData.allAddons.forEach(addon => {
				if ((addon.types || []).length)
					addon.types.forEach(type => {
						if (types.indexOf(type) == -1) {
							addons[type] = []
							types.push(type)
						}
						addons[type].push(addon)
						if (!addons['All'].filter(el => { return el.repo == addon.repo }).length && !addon.sideloaded)
							addons['All'].push(addon)
					})
			})
			const tabs = []
			const tabData = {}
			let str = ''

			for (key in addons) {
				if (!$('#' + key).length) {
					str += '' +
						'<details class="mdl-expansion">' +
							'<summary class="mdl-expansion__summary">' +
								'<span class="mdl-expansion__header">' + 
									key +
								'</span>' +
							'</summary>' +
							'<div class="mdl-expansion__content">' +
								'<table class="mdl-data-table mdl-js-data-table" id="' + key + '">'

					addons[key].forEach(addon => { str += addonToRow(jsonData, addon) })
					str += '' +
								'</table>' +
							'</div>' +
						'</details>'
				} else {
					let typeStr = ''
					addons[key].forEach(addon => { typeStr += addonToRow(jsonData, addon, loading) })
					$('#' + key).html(typeStr)
				}
			}

			$('.content').append(str)

			cb && (typeof cb == 'function') && cb()
		} else
			console.error(new Error('Could not connect to API'))

	})
}

let dialog

function init() {
	dialog = document.querySelector('dialog')
	dialogPolyfill.registerDialog(dialog)
	updateView()
}

$(document).ready(() => {
	tryLoginLocal(localStorage.password, (err, success) => {
		dialog = document.querySelector('dialog')
		dialogPolyfill.registerDialog(dialog)
		if (!err && success) {
			updateView()
			return
		} else if (err) {
			if (err == 'err-no-api')
				$('.mdl-dialog').text('Cannot connect to API')
			else if (err == 'err-bad-pass')
				window.location.href = '/login.html'
		} else
			$('.mdl-dialog').text('Unknown API error')
		dialog.showModal()
	})
})
