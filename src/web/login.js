
function tryLoginLocal(testPass, cb) {
	const pass = testPass || ''
	$.get('login-api?method=hidden', config => {
		if (config && config.hasOwnProperty('pass')) {
			function fail() { cb('err-bad-pass') }
			if (config.pass) {
				if (!pass) {
					fail()
				} else {
					$.get('login-api?method=check&val=' + pass, data => {
						if (data && data.success) cb(null, true)
						else fail()
					})
				}
			} else
				cb(null, true)
		} else
			cb('err-no-api')
	})
}

function loginCloseDialog() {
	loginDialog.close()
}

function tryLoginForm() {
	const pass = $('#password').val()
	tryLoginLocal(pass, (err, success) => {
		if (!err && success) {
			localStorage.password = pass
			window.location.href = '/'
		} else {
			$('.mdl-dialog').html('<div class="nosettings">Incorrect password</div><button class="mdl-button mdl-js-button mdl-button--raised" onClick="loginCloseDialog()">Close</button>')
			componentHandler.upgradeAllRegistered()
	    	loginDialog.showModal()
		}
	})
}

let loginDialog

function loginInit() {
	$('.loginForm').on('submit', e => { e.preventDefault() })
	loginDialog = document.querySelector('dialog')
	dialogPolyfill.registerDialog(dialog)
}
