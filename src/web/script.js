
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
	getFunction()(() => {
		componentHandler.upgradeAllRegistered()
		request('install', name, '', () => { updateView(search) })
	}, repo)
}

function forceStart(repo) {
	getFunction()(() => {
		componentHandler.upgradeAllRegistered()
		request('run', repoName(repo), '', () => { updateView(search) })
	}, repo)
}

function start(repo, repoTitle) {
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

function warningPortForward() {
	dialog.close()
	let str = '' +
		'<h4>WARNING</h4><div style="text-align:left">Enabling external (internet) use of PimpMyStremio requires the user to set a static IP to this device and setup port forwarding in the router.<br><br>The port that PimpMyStremio\'s server uses MUST be allowed to communicate externally from this device\'s IP address.<br><br>If this is not done, then PimpMyStremio will fail to load in the browser and you will be locked out.<br><br><b>This message will only show once, if you still wish to make PimpMyStremio available externally, then open the settings and select the option again.</b></div>' +
		'<div style="height: 35px"></div>' +
		'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised ext" onClick="closeDialog()">' +
			'I understand' +
		'</button></div>'
	$('.mdl-dialog').html(str)
	componentHandler.upgradeAllRegistered()
	setTimeout(() => {
		dialog.showModal()
	})
}

function loadQr(path) {
	dialog.close()
	let str = '' +
		'<div class="qr-hold"><img class="qrCode" src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=' + getUrl(true) + path + '"></div>' +
		'<div style="height: 35px"></div>' +
		'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised ext" onClick="closeDialog()">' +
			'Close' +
		'</button></div>'
	$('.mdl-dialog').html(str)
	componentHandler.upgradeAllRegistered()
	onImgLoad('.qrCode', () => {
		dialog.showModal()
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
			'<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent ext settingsMainButton" onClick="loadQr(\'' + path + '\')">' +
				'Load with QR Code' +
			'</button>'
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
	if (shouldRun && shouldRestart) {
		// these are the main settings
		if (obj['externalUse'] == 'External') {
			if (!localStorage.getItem('warnedPortForward')) {
				// warn users regarding port forwarding
				localStorage.setItem('warnedPortForward', 'true')
				warningPortForward()
				return
			}
		}
	}

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

function basicSettings(repo, repoTitle, isRunning, noSettings) {
	let str = '<center><h4 class="settingsTop">Settings</h4><br/><span class="settingsSub">' + repoTitle + '</span></center>'
	if (repo != '_pimpmystremio') {
		const path = '/' + repoName(repo) + '/manifest.json'
		str += '<div>' +
			'<div class="copy-box" onClick="copyManifestUrl(\'' + window.location.href.slice(0, -1) + path + '\')">Add-on URL (click to copy)</div>' +
			'<button class="mdl-button mdl-js-button mdl-button--raised load-button" style="' + (noSettings ? 'margin-top:0' : '') + '" onClick="external(\'' + repoTitle + '\', \'' + path + '\')"' + (!isRunning ? ' disabled' : '')  + '>' +
				'Load' +
			'</button>' +
			'</div>'
	}
	return str
}

function closeSearch() {
	$('#searchResults').hide().empty()
	$('.searchContent').hide(() => {
		$('#query').val('')
	})
	$('.content').fadeIn()
	$('.footer').show()
	$('.searchButton').addClass('mdl-button--colored')
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
		closeSearch()
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

function shutdown() {
	request('shutdown', '', '', () => {})
}

function uninstall(repoName) {
	closeDialog()
	request('remove', repoName, '', () => {
		updateView(search)
	})
}

function settings(repo, repoTitle, isRunning) {
	request('addonConfig', repoName(repo), '', addonConfig => {
		if (!Object.keys(addonConfig).length) {
			let str = '<div class="no-setting">' + basicSettings(repo, repoTitle, isRunning, true)
			str += '<br/><br/><br/>' +
					'<button class="mdl-button mdl-js-button mdl-button--raised uninst" onClick="uninstall(\''+repoName(repo)+'\')">' +
						'Uninstall' +
					'</button>' +
					'<button class="mdl-button mdl-js-button mdl-button--raised" onClick="closeDialog()">Close</button>'+
				'</div>'
			$('.mdl-dialog').html(str)
			componentHandler.upgradeAllRegistered()
	    	dialog.showModal()
			setTimeout(() => {
				document.activeElement.blur()
			})
		} else {
			request('defaultConfig', repoName(repo), '', defaultConfig => {
				let str = basicSettings(repo, repoTitle, isRunning)
				str += '<form class="settingsForm" action="#">'
				for (let key in defaultConfig) {
					if (['string', 'number'].indexOf(defaultConfig[key].type) > -1) {
						const val = addonConfig[key] === 0 || !!addonConfig[key] ? ' value="' + (addonConfig[key] + '').split('"').join('\\"') + '"' : ''
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
				let uninstButton = ''
				if (repo != '_pimpmystremio') {
					buttons += '' +
							'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent settingsRun" onClick="saveSettings(true)">' +
								'Save and Run' +
							'</button>' +
							'<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent" onClick="saveSettings()">' +
								'Save' +
							'</button>' +
							'</div>'
					uninstButton = '<button class="mdl-button mdl-js-button mdl-button--raised uninst" onClick="uninstall(\''+repoName(repo)+'\')">' +
								'Uninstall' +
							'</button>'
				} else
					buttons += '' +
							'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent settingsRun" onClick="saveSettings(true, true)">' +
								'Save and Restart' +
							'</button>' +
							'<div class="settingsFooter"><button class="mdl-button mdl-js-button mdl-button--raised" onClick="shutdown()">' +
								'Shutdown' +
							'</button>' +
							'</div>'
				let closeButton = '' +
							'<button class="mdl-button mdl-js-button mdl-button--raised" onClick="closeDialog()">' +
								'Close' +
							'</button>'
				$('.mdl-dialog').html(str + buttons +'</form>' + uninstButton + closeButton)
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
				const tag = key.split(' ').join('-')
				if (!$('#' + tag).length) {
					str += '' +
						'<details class="mdl-expansion">' +
							'<summary class="mdl-expansion__summary">' +
								'<span class="mdl-expansion__header">' +
									key +
								'</span>' +
							'</summary>' +
							'<div class="mdl-expansion__content">' +
								'<table class="mdl-data-table mdl-js-data-table" id="' + tag + '">'

					addons[key].forEach(addon => { str += addonToRow(jsonData, addon) })
					str += '' +
								'</table>' +
							'</div>' +
						'</details>'
				} else {
					let typeStr = ''
					addons[key].forEach(addon => { typeStr += addonToRow(jsonData, addon, loading) })
					$('#' + tag).html(typeStr)
				}
			}

			$('.content').append(str)

			cb && (typeof cb == 'function') && cb()
		} else
			console.error(new Error('Could not connect to API'))

	})
}

let dialog

$(document).ready(() => {
    insertTheme();
	tryLoginLocal(localStorage.password, (err, success) => {
		dialog = document.querySelector('dialog')
		dialogPolyfill.registerDialog(dialog)
		if (!err && success) {
			// update version in settings menu
			request('getVersion', '', '', data => {
				if ((data || {}).version)
					$('.mainSettings')[0].onclick = function() { settings('_pimpmystremio', 'PimpMyStremio v' + data.version) }
			})

			// allow to close modal by clicking outside it
			dialog.addEventListener('click', function (event) {
				if (!event.clientY || !event.clientX) return
				const rect = dialog.getBoundingClientRect();
				const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width)
				if (!isInDialog)
					dialog.close()
			})

			$('#query').keydown(evt => {
				evt = evt || window.event
				if (evt.keyCode === 27 || !!(evt.key === "Escape" || evt.key === "Esc")) {
					$('#query').blur()
					closeSearch()
				} else
					search()
			})

			setInterval(() => {
				request('shouldUpdateWeb', '', '', resp => {
					if ((resp || {}).shouldUpdateWeb)
						updateView()
				})
			}, 20000)

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
