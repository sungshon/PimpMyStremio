
// material ui colors can be seen at: https://getmdl.io/customize/index.html

const materialUiColors = ['deep_orange', 'red', 'pink', 'purple', 'deep_purple', 'indigo', 'blue', 'light_blue', 'cyan', 'teal', 'green', 'light_green', 'lime', 'yellow', 'amber', 'orange']

// dark colors can only be used as the first color

const materialUiDarkColors = ['brown', 'blue_grey', 'grey']

function validateColors(colors) {
    if (materialUiColors.indexOf(colors[0]) > -1 || materialUiDarkColors.indexOf(colors[0]) > -1)
        if (materialUiColors.indexOf(colors[1]) > -1)
            return true
    return false
}

function getColorsCss(colors) {
	return 'https://code.getmdl.io/1.3.0/material.' + colors[0] + '-' + colors[1] + '.min.css'
}
