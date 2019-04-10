
const localtunnel = require('localtunnel')

// not used, using serveo instead

const proxy = require('../proxy')

let allowClose = false

let once

let firstTime

function runTunnel(addonPort, remoteOpts) {
    const tunnel = localtunnel(addonPort, remoteOpts, (err, tunnel) => {

        if (err) {
            console.error(err)
            return
        }

        if (!firstTime || !remoteOpts.subdomain) {
            firstTime = true
            console.log('Remote PimpMyStremio URL: '+tunnel.url+'/')
            proxy.setEndpoint(remoteUrl)
        } else {
            console.log('Reconnected Tunnel as: '+tunnel.url)
        }

        if (remoteOpts.subdomain && !tunnel.url.startsWith('https://' + remoteOpts.subdomain + '.')) {
            console.log('Subdomain set but tunnel urls do not match, closing tunnel and trying again in 30 secs')
            cleanClose(30)
        }
    })

    function cleanClose(secs) {
        tunnel.removeListener('close', onClose)
        tunnel.removeListener('error', onError)
        tunnel.close()
        setTimeout(() => {
            runTunnel(addonPort, remoteOpts)
        }, secs * 1000)
    }

    function onClose() { if (allowClose) process.exit() }

    function onError(err) {
        console.error('caught exception:')
        console.error(err)
        console.log('Tunnel error, closing tunnel and trying again in 30 secs')
        cleanClose(30)
    }

    tunnel.on('close', onClose)
    tunnel.on('error', onError)

    if (!once) {
        once = true

        const cleanUp = require('death')({ uncaughtException: true })

        cleanUp((sig, err) => {
            console.error(err)
            allowClose = true
            tunnel.close()
        })
    }
}

module.exports = runTunnel
