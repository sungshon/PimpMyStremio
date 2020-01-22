# PimpMyStremio Internal Modules

A list of modules that are also allowed to be required in local add-ons, but are handled internally by PimpMyStremio, as opposed to the [whitelisted modules](./modules-whitelist.md).

## Cinemeta

Gets movie / series metadata from Cinemeta based on IMDB ID and type (`movie` or `series`)

```javascript
const { cinemeta } = require('internal')

cinemeta.get({ imdb: 'tt0944947', type: 'series' }).then(resp => {
  // resp is Game of Thrones metadata
}).catch(err => {
  // error
})
```

## Eval

A safer `eval`, as the default one is disabled in the sandbox.

```javascript
const evl = require('eval')

evl('Math.random()').then(resp => {
  // resp is 0.8169928584181472
}).catch(err => {
  // error
})
```

Note: There is a 60 second timeout on eval, if the script doesn't end until then, it will be forcefully stopped.

## Proxy

The proxy has a synchronous API that allows you to change headers of URLs on the fly, disabling CORS, referrer checks, etc.

```javascript
const { proxy } = require('internal')

const opts = { headers: { referer: 'https://www.imdb.com/' } }

const proxiedURL = proxy.addProxy('https://www.imdb.com/title/tt0944947/', opts)
```

Supported proxy options:

```
{
  "headers": { // custom request headers
    "referer": "https://www.imdb.com/"
  },
  "subtitle": {
    "convert": true, // default: false, converts subtitles: sub, ass, ssa, sbv, vtt, smi, lrc to srt
    "encodeUtf8": true, // default: false, encodes the subtitle to UTF8
    "encoding": "ISO-8859-7" // default: false, set currect encoding manually, if this is not set it will be guessed
  },
  "playlist": true, // default: false, if segments of hls are from a separate domain then the playlist, this proxifies the segment URLs too, it also proxifies any hls key url too where applicable
  "noFollowSegment": false // default: false, when setting the playlist property to true the default behavior is to proxify all segments also, but there is a case where you might want to proxify only the hls key url, setting this property to true allows that
}
```

To note:

- This proxy can be used for video streams, m3u8 playlists, subtitles, images
- Stremio only supports srt and vtt subtitles, it is the reason there is a converter for subtitles in the proxy
- Stremio also only supports UTF-8 subtitles, this is why u can use the proxy to guess the encoding (or set it manually) and convert subtitle text to UTF-8


## PhantomJS

This is an internal function that uses [phantom](https://www.npmjs.com/package/phantom) under the hood.

```javascript
const phantom = require('phantom')

phantom.load(options, clientArguments, phantomOptions, (instance, page) => {
  // ..
})
```

In this example code:
- `options` - refers to an object of internal options, supports `agent` (string) for user agent, `headers` for an object of custom headers, `noRedirect` (boolean) to block the page from redirecting, `clearMemory` (boolean) to not use cached data when loading the page and `polyfill` (boolean, default is `false`) to inject core.js (thorough ES polyfill) in the page
- `clientArguments` is an array of strings that includes the client arguments to pass to the phantomjs binary (as used in [phantom](https://www.npmjs.com/package/phantom)), default is: `["--ignore-ssl-errors=true", "--web-security=false", "--ssl-protocol=tlsv1", "--load-images=false", "--disk-cache=true"]`
- `phantomOptions` is an object of options as used in [phantom](https://www.npmjs.com/package/phantom), default is: `{ logLevel: 'warn' }`

**Warning: always close your phantomjs page when you're done, like so:**

```javascript
phantom.close(instance, page, callback)
```

## Stremio Add-on SDK

The add-on sdk, although exactly like [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk#readme), is considered an internal module because it's actually a shim of the actual SDK.

While all of the same rules apply as with the original SDK, the only difference is that you need to have the sdk code in `index.js` in your root folder, and it must end with `module.exports = getRouter(addonInterface)`.

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

builder.defineSubtitlesHandler(args => {
  // ...
})

const addonInterface = getInterface(builder)

module.exports = getRouter(addonInterface)
```

Notes:
- You can also export a promise to `module.exports` (for example, if you need to wait for additional data in order to reply with the add-on manifest), but for safety reasons if the exported promise fails to respond in 50 seconds, the add-on will be forcefully stopped
- If an add-on fails to respond to a request (catalog, meta, streams, subtitles) within 120 seconds since the request was started, the add-on will be forcefully closed

## Config

This internal module is [described here](https://github.com/sungshon/PimpMyStremio/tree/master/docs#user-settings)

## Persisted Data

This internal module is [described here](https://github.com/sungshon/PimpMyStremio/tree/master/docs#persisted-data)




