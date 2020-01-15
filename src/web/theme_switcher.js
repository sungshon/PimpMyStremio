const availableThemes = ['default', 'dark'];

function insertTheme() {
    request('addonConfig', '_pimpmystremio', '', userConfig => {
        let themeOpt = 0;
        if (userConfig.darkMode) themeOpt = 1;
        const theme = availableThemes[themeOpt];
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.id = 'theme';
        link.href = '/themes/' + theme + '.css';
        document.head.appendChild(link);
    })
}
