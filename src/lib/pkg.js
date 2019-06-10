// this is required for pkg to bundle these scripts

function dummies() {
	require('ssh2-streams/lib/jsbn')
	require('vm2/lib/sandbox')
	require('vm2/lib/contextify')
	require('vm2/lib/wildcard')
	require('subsrt/lib/format/ass')
	require('subsrt/lib/format/json')
	require('subsrt/lib/format/lrc')
	require('subsrt/lib/format/sbv')
	require('subsrt/lib/format/smi')
	require('subsrt/lib/format/srt')
	require('subsrt/lib/format/ssa')
	require('subsrt/lib/format/sub')
	require('subsrt/lib/format/vtt')
	require('cache-manager/lib/stores/memory')
}

module.exports = () => {}
