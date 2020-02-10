# PimpMyStremio Client Arguments

`--verbose` - run in verbose mode for debugging app and/or add-on errors

`--linux-tray` - on OSX and Win the app runs hidden and with a system tray by default, in Linux though, the system tray [has dependencies](https://github.com/sungshon/PimpMyStremio/issues/7#issuecomment-494431293), use this setting to run the app with a system tray on Linux

`--no-children` - by default this app runs each add-on in a separate process, this adds security but also increases add-on load time significantly, use this setting to make add-ons run in the same process as the app

`--sideload=` - set custom add-on sideload directory instead of the default one (example usage: `--sideload="D:\PMS Sideload"` or `--sideload="/Users/sungshon/pms-sideload"`)

`--lan-ip=` - set custom LAN IP to overwrite the auto-detected value, useful if "Remote Access" is set to "LAN" and the user has more then one network adapter (example usage: `--lan-ip="192.168.0.10"`)

`--uninstall` - uninstalls PimpMyStremio and removes all user defined data
