
const availableThemes = {
    'Light': {
        material_ui_colors: ['orange', 'indigo'],
        styles: 'default.css',
    },
    'Dark': {
        material_ui_colors: ['orange', 'indigo'],
        styles: 'dark.css',
    },
    'Rusty': {
        material_ui_colors: ['grey', 'orange'],
        styles: 'rust.css',
    },
    'Sky': {
        material_ui_colors: ['brown', 'blue'],
        styles: 'sky.css',
    },
    'Light Orange': {
        material_ui_colors: ['amber', 'orange'],
        styles: 'default.css',
    },
    'Light Blue': {
        material_ui_colors: ['indigo', 'blue'],
        styles: 'default.css',
    },
    'Light Green': {
        material_ui_colors: ['light_green', 'green'],
        styles: 'default.css',
    },
    'Dark Purple': {
        material_ui_colors: ['deep_orange', 'deep_purple'],
        styles: 'dark.css',
    },
    'Dark Blue': {
        material_ui_colors: ['blue', 'indigo'],
        styles: 'dark.css',
    },
    'Dark Green': {
        material_ui_colors: ['teal', 'green'],
        styles: 'dark.css',
    },
};

function stylesLoaded(cssStylesheet, cb) {
    // this is a hack, but the only cross-browser solution I could find
    var img = document.createElement('img')
    img.onerror = cb
    img.src = cssStylesheet
}

function injectCss(cssFile, cb) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssFile
    link.type = 'text/css'
    if (cb)
        stylesLoaded(link, cb)
    document.head.appendChild(link)
}

function insertTheme() {
    request('addonConfig', '_pimpmystremio', '', userConfig => {

        const theme = availableThemes[userConfig.theme] || availableThemes['Light']

        if (!theme.material_ui_colors || !validateColors(theme.material_ui_colors))
            theme.material_ui_colors = availableThemes['Light'].material_ui_colors

        if (!theme.styles)
            theme.styles = availableThemes['Light'].styles

        // load material ui colors first
        injectCss(getColorsCss(theme.material_ui_colors), injectCss.bind(null, '/themes/' + theme.styles))

    })
}
