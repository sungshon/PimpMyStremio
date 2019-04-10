# PimpMyStremio Developer Documentation

PimpMyStremio add-ons are almost exactly the same as add-ons created with [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk/), so make sure you read the Add-on SDK documentation before anything else.

PimpMyStremio add-ons all run in a sandbox, and can only require the [whitelisted modules](./modules-whitelist.md) and a few [internal modules](./modules-internal.md).

With that said, the whitelisted module list is a large one, that should get you set for any circumstance you might encounter.

If you need a module that is not on the whitelist for your add-on, create an issue for it, and we'll see if we can add it for you.

Key features: auto-updates itself, auto-updates add-ons (using the releases info of their github pages), wide range of whitelisted add-ons, persisted data, user add-on configuration

## Difference between SDK and PimpMyStremio add-ons

PimpMyStremio add-ons all need to have an `index.js` file as the entry point, are written in Node.js and `index.js` must export the `stremio-addon-sdk` router.

`index.js` example:

```javascript
const { addonBuilder, getInterface, getRouter } = require('stremio-addon-sdk')

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

const addonInterface = getInterface(builder)

module.exports = getRouter(addonInterface)
```

To better understand this code, please refer to the [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk/) documentation.

## Testing add-ons

You can ofcourse use the [stremio-addon-sdk Testing](https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/testing.md) documentation to test your add-on in Stremio before even using it in PimpMyStremio, as long as you only use the whitelisted it should have no issues working with PimpMyStremio too.

Alternatively, you can also sideload add-ons into PimpMyStremio to test them with it directly.

To sideload add-ons, you will need to create a new directory at one of these paths:

OSX: `~/Library/Preferences/PimpMyStremio/sideload/`
Win: `C:\Users\[username]\AppData\PimpMyStremio\sideload\`
Linux: `~/.local/share/PimpMyStremio/sideload/`

After creating a new directory, add `index.js` (described above) and `config.json` (described below) to it.

Now when you start PimpMyStremio, your local add-on will be automatically loaded and available in the "Sideloaded" section.

If the errors of your add-on are not visible (this usually only happens to type errors), then you can set the `PMS_UNSAFE` environment variable to any value to load your add-on directly in PimpMyStremio instead of sandboxing it.

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
  }
}
```

- `required` is optional and defaults to `false`
- `type` can be "string", "number" or "boolean"
- `default` represents the default value
- `title` is a string that will serve as the human-readable title for the users

And the property name is what you will get back in the `config` option with the user set (or default) value

To get the config in code, just do:

```javascript
const { config } = require('internal')
```

## Persisted data

This internal module is much like `localStorage`, as it's an object that will persist your data through app close / add-on close.

Example:

```javascript
const { persist } = require('internal')

console.log('persist.myVar')

persist.myVar = 'hello world'
```

## Publishing an add-on

To publish your add-on, make a PR to this repository adding it to the [addonsList.json](https://github.com/sungshon/PimpMyStremio/blob/master/src/addonsList.json) file.
