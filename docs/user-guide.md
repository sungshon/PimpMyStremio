# PimpMyStremio User Guide

- [Quickstart Guide](#quickstart-guide)
- [Access Remotely](#access-remotely)
- [Loading Add-ons Remotely on other Devices](#loading-add-ons-remotely-on-other-devices)
- [Running on Android](#running-on-android)


### Quickstart Guide

After running the application, it would normally update to the latest release. After this is done, you will be presented with a page in your browser.

You will see a [list of categories](https://pms-images.now.sh/category-list.png).

Click any of the categories to see the add-ons it holds.

After choosing an add-on you want, you must first click the [download button](https://pms-images.now.sh/download-button.png).

After the add-on has downloaded, click the [play button](https://pms-images.now.sh/play-button.png) to load the add-on.

It is worth mentioning that some add-ons will open their settings menu after you press the [play button](https://pms-images.now.sh/play-button.png), this is because those add-ons require additional user settings in order to work. If you do not know what settings to choose just press cancel or uninstall that add-on.

Choose more add-ons you want and download, then play each one.

After you are done choosing and running all the add-ons you want, scroll to the top of the page and press the [external button](https://pms-images.now.sh/external-button.png).

After pressing the [external button](https://pms-images.now.sh/external-button.png) you will be [presented with a menu](https://pms-images.now.sh/choose-stremio.png) where you will need to choose between Stremio App or Stremio Web.

More streams will work in the Stremio App, so this is the recommended choice, but there are many add-ons that will work with just Stremio Web too.

Simply press "Load in Stremio App" (the recommended choice, requires [Stremio](https://www.stremio.com/) installed), and this will load all your PimpMyStremio add-ons in Stremio.

You should be aware that PimpMyStremio add-ons only work while PimpMyStremio is running, it is for this reason why it is recommended to set PimpMyStremio to run on start-up, you can do so by pressing the [settings button](https://pms-images.now.sh/settings-button.png) (located to the top right of the PimpMyStremio page) and enabling the "Run on start-up" setting.


### Access Remotely

By default, PimpMyStremio runs only locally (on the device it was installed on). If you wish to make PimpMyStremio (and it's add-ons) work through LAN or the Internet, then you will have to enable this manually.

First press the [settings button](https://pms-images.now.sh/settings-button.png) (located to the top right of the PimpMyStremio page), now set a password for your server. This is very important to do as you'll make the server available online.

Now under the "Remote Access" change "No (local)" to either "LAN" or "External" (external means available on the internet).

**WARNING:** If you select "Remote Access: External" you MUST set a static LAN IP for the device that's running PimpMyStremio, and you also MUST setup port forwarding in your router to allow PimpMyStremio's port externally (default port is: `7777`). If you do not do this, then the external URL will not work and you will be locked out of PimpMyStremio.

Now select "Save and Restart". Your PimpMyStremio app will restart, but this time it will load in your browser with a remote URL, instead of a local one.


### Loading Add-ons Remotely on other Devices

If you have enabled "Remote Access" through "LAN" or "External", you can now install your add-ons on different devices.

There are 2 ways to do this, the simplest way is to press the [external button](https://pms-images.now.sh/external-button.png) (located to the top right of the PimpMyStremio page), and then press "Load With QR Code", then scan that QR code with your phone and enjoy your add-ons remotely!

The second way is to copy PimpMyStremio's URL from the browser, send it to your phone, and open it in the phone's browser, to use PimpMyStremio from there.


### Running on Android

Running PimpMyStremio on Android directly is not officially supported, it is for this reason that we recommend you use the suggested method at [Access Remotely](#access-remotely) to use PimpMyStremio on your phone.

With that said, a user has created [a guide](https://gist.github.com/sleeyax/e9635eb352a4fcdf94194f763d743689) to getting PimpMyStremio to work on Android with the help of the [Termux](https://termux.com/) phone app.
