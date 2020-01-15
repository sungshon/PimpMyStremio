const availableThemes = ['default', 'dark'];
let theme = localStorage.getItem('theme') || 'default';

function insertTheme() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = 'theme';
    link.href = '/themes/' + theme + '.css';
    document.head.appendChild(link);
}

function toggleTheme() {
    // get next theme
    let nextIndex = availableThemes.indexOf(theme) + 1;
    if (nextIndex > availableThemes.length - 1)
        nextIndex = 0;

    theme = availableThemes[nextIndex];

    // apply theme
    $('#theme').attr('href', '/themes/' + theme +  '.css');
    localStorage.setItem('theme', theme);
}
