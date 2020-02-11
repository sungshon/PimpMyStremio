# PimpMyStremio Themes

- [Creating a Theme](#creating-a-theme)


### Creating a Theme

To create a theme, first clone and install this repository:

```
git clone https://github.com/sungshon/PimpMyStremio.git
cd PimpMyStremio
cd src
npm install
```

Additionally, you can run `npm start` too to start the project. But this is not required for now.

First add your theme name to the theme list in the [user configuration](https://github.com/sungshon/PimpMyStremio/blob/ce36a5f2f86f44f75fe019ad1bb24bb47a5b2a0f/src/lib/config/userConfig.js#L22).

Then add your new theme (with the exact same name as stated in the user configuration) to the [available themes](https://github.com/sungshon/PimpMyStremio/blob/ce36a5f2f86f44f75fe019ad1bb24bb47a5b2a0f/src/web/theme_switcher.js#L2).

Themes currently only support 2 values:
- `material_ui_colors` - supports setting the two [material ui colors](https://getmdl.io/customize/index.html), or check the available colors in the [color logic file](https://github.com/sungshon/PimpMyStremio/blob/ce36a5f2f86f44f75fe019ad1bb24bb47a5b2a0f/src/web/theme_colors.js)
- `styles` - the css file name for your theme, you can create your own file or use [one of the available styles](https://github.com/sungshon/PimpMyStremio/tree/ce36a5f2f86f44f75fe019ad1bb24bb47a5b2a0f/src/web/themes)

That's it, now run PimpMyStremio with `npm start` (in the `/src` folder), test your theme (by selecting it in the settings, then saving and restarting), and finally PR it to this repository!

