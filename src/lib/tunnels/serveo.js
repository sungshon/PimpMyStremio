const Client = require('ssh2').Client // To communicate with Serveo
const Socket = require('net').Socket // To accept forwarded connections (native module)
const opn = require('open')
const proxy = require('../proxy')

const verbose = process.env['PMS_VERBOSE']
const isStartup = process.env['PMS_STARTUP']

let firstRun = true

function runTunnel(pmsPort, remoteOpts) {

    // Create a SSH client
    const conn = new Client();

    const config = {
      remoteHost: remoteOpts.subdomain || '',
      remotePort: 80,
      localHost: 'localhost',
      localPort: pmsPort
    }

    conn
      .on('error', err => {
        if (err)
            console.error(err)
        console.log('Serveo - Got error from tunnel, restarting connection in 5 seconds')
        setTimeout(() => {
            runTunnel(pmsPort, remoteOpts)
        }, 5000)
      })
      .on('ready', () => {
        // When the connection is ready
        if (verbose)
          console.log('Serveo - Connection ready')
        // Start an interactive shell session
        conn.shell((err, stream) => {
          if (err) throw err;
          // Display the shell output
          stream.on('data', data => {
            if (firstRun) {
                firstRun = false
                const remoteUrl = 'https://' + config.remoteHost + '.serveo.net'
                proxy.setEndpoint(remoteUrl)
                console.log('Remote PimpMyStremio URL: ' + remoteUrl)
                if (!isStartup)
                  opn(remoteUrl)
            }
            if (verbose)
                console.log('Serveo - SHELL OUTPUT: ' + data)
          })
        })
        // Request port forwarding from the remote server
        conn.forwardIn(config.remoteHost, config.remotePort, (err, port) => {
          if (err) throw err
          conn.emit('forward-in', port)
        })
      })
      .on('tcp connection', (info, accept, reject) => {
        if (verbose)
            console.log('Serveo - Incoming TCP connection', JSON.stringify(info))
        let remote
        const srcSocket = new Socket()
        srcSocket
          .on('error', err => {
            if (remote === undefined) reject()
            else remote.end()
          })
          .connect(config.localPort, config.localPort, () => {
            remote = accept()
              .on('close', () => {
                if (verbose)
                  console.log('Serveo - TCP :: CLOSED')
              })
              .on('data', data => {
                if (verbose)
                    console.log(
                      'Serveo - TCP :: DATA: ' +
                        data
                          .toString()
                          .split(/\n/g)
                          .slice(0, 2)
                          .join('\n')
                    );
              });
            if (verbose)
                console.log('Serveo - Remote connection established')
            srcSocket.pipe(remote).pipe(srcSocket)
          })
      })
      .connect({
        host: 'serveo.net',
        username: 'johndoe',
        keepaliveInterval: 60000,
//        tryKeyboard: true
      })

}

module.exports = runTunnel
