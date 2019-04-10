// this is required for pkg to bundle these scripts

function dummies() {
	require('ssh2-streams/lib/jsbn')
	require('vm2/lib/sandbox')
	require('vm2/lib/contextify')
}

module.exports = () => {}
