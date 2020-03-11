# PimpMyStremio Developer Documentation

PimpMyStremio add-ons are almost exactly the same as add-ons created with [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk/), so make sure you read the Add-on SDK documentation before anything else.

PimpMyStremio add-ons all run in a sandbox, and can only require the [whitelisted modules](./modules-whitelist.md) and a few [internal modules](./modules-internal.md).

With that said, the whitelisted module list is a large one, that should get you set for any circumstance you might encounter.

If you need a module that is not on the whitelist for your add-on, create an issue for it, and we'll see if we can add it for you.

Key features: auto-updates itself, auto-updates add-ons, wide range of whitelisted add-ons, persisted data, user add-on configuration, running remotely

## Difference between SDK and PimpMyStremio add-ons

PimpMyStremio add-ons all need to have an entry point, by default `./index.js` is used, you can set a different entry point by setting the `entry` property for your addon in `addonsList.json`.

All addons are written in Node.js and the entry point must export the `stremio-addon-sdk` router.

Example:

```javascript
const { addonBuilder, getRouter } = require('stremio-addon-sdk')

const builder = new addonBuilder(manifest)

builder.defineCatalogHandler(args => {
  // ..
})

builder.defineMetaHandler(args => {
  // ..
})

builder.defineStreamHandler(args => {
  // ...
})

builder.defineSubtitlesHandler(args => {
  // ...
})

module.exports = getRouter(builder.getInterface())
```

To better understand this code, please refer to the [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk/) documentation.

Notes:
- You can also export a promise to `module.exports` (for example, if you need to wait for additional data in order to reply with the add-on manifest), but for safety reasons if the exported promise fails to respond in 50 seconds, the add-on will be forcefully stopped
- If an add-on fails to respond to a request (catalog, meta, streams, subtitles) within 120 seconds since the request was started, the add-on will be forcefully closed

## Testing add-ons

You can ofcourse use the [stremio-addon-sdk Testing](https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/testing.md) documentation to test your add-on in Stremio before even using it in PimpMyStremio, as long as you only use the whitelisted modules it should have no issues working with PimpMyStremio too.

Alternatively, you can also sideload add-ons into PimpMyStremio to test them with it directly.

To sideload add-ons, you will need to create a new directory at one of these paths:

- OSX: `~/Library/Preferences/PimpMyStremio/sideload/`
- Win: `C:\Users\[username]\AppData\PimpMyStremio\sideload\`
- Linux: `~/.local/share/PimpMyStremio/sideload/`

After creating a new directory, add `index.js` (described above) and `config.json` (described below) to it.

Now when you start PimpMyStremio, your local add-on will be automatically loaded and available in the "Sideloaded" section.

## User settings

Your add-on can specify that it supports (or requires) user settings, to do so, create a `config.json` file in the root directory of your add-on.

`config.json` example:

```json
{
  "host": {
    "title": "Host",
    "type": "string",
    "default": "http://shiny.website.com"
  },
  "username": {
    "title": "Username",
    "type": "string",
    "default": "",
    "required": true
  },
  "password": {
    "title": "Password",
    "type": "string",
    "default": "",
    "required": true
  },
  "style": {
    "title": "Display Style",
    "type": "select",
    "options": ["Catalog", "Filters", "Channel"],
    "default": "Channel"
  }
}
```

- `required` is optional and defaults to `false`
- `type` can be "string", "number", "boolean" or "select"
- `default` represents the default value
- `title` is a string that will serve as the human-readable title for the users
- `options` is an array of strings, only used for "select" type

And the property name is what you will get back in the `config` option with the user set (or default) value

To get the config in code, just do:

```javascript
const { config } = require('internal')
```

## Persisted data

This internal module is much like `localStorage`, as it's a utility that will persist your data through app close / add-on close.

Example:

```javascript
const { persist } = require('internal')

console.log(persist.getItem('myVar'))

persist.setItem('myVar', 'hello world')
```

Also supports `.removeItem()` to remove a key and `.clear()` for clearing the entirety of the data.

## Publishing an add-on

To publish your add-on, make a PR to this repository adding it to the [addonsList.json](https://github.com/sungshon/PimpMyStremio/blob/master/src/addonsList.json) file.

Note that the default entry point for an addon is `./index.js`, you can set a different entry point by setting the `entry` property to a relative path for your addon in `addonsList.json`.

## Updating an add-on

The only thing you need to do is to publish a new release on GitHub, you don't need to add any files to it, as GitHub automatically archives the sources and that archive will be used to update your add-on to all it's users.

