# Feri Extension - Deploy

Deploy guide for the Feri browser extension that connects to the [Feri](https://github.com/nightmode/feri) build tool and automatically reloads a browser tab when files change.

## Navigation

* [Overview](../README.md#overview)
* [Install](../README.md#install)
* [Usage](usage.md#usage)
* [Development](development.md#development)
* Deploy
* [Thanks](../README.md#thanks)
* [Support](../README.md#support)

## Deploy

Instructions mostly for myself but feel free to use them if you are forking this repo and plan on publishing your own extension.

No matter which platform you are deploying on, make sure `local.setting.log` is `false` in `deploy/js/shared.js`. If left on, the extension will spend time logging information that most users will never see.

### Deploy for Chrome

Zip up everything in the `deploy` directory.

Upload the zip file to the Chrome Web Store via the [Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).

### Deploy for Edge

Zip up everything in the `deploy` directory.

Upload the zip file to the Microsoft Edge Addons site via the [Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview).

### Deploy for Firefox

Edit `deploy/manifest.json` and temporarily add the following object before the `permissions` object.

```
"browser_specific_settings": {
    "gecko": {
        "id": "feri@knightmode.addons.mozilla.org",
        "strict_min_version": "68.0"
    }
},
```

Make sure the `browser_specific_settings` > `gecko` > `id` string is related to the add-on developer account you will be using.

Zip up everything in the `deploy` directory and set the zip file aside for a moment.

Restore `deploy/manifest.json` to its default state, without the `browser_specific_settings` object.

Upload the zip file to the Firefox Add-ons site via the [Developer Hub](https://addons.mozilla.org/en-US/developers/addons).

## License

MIT © [Kai Nightmode](https://nightmode.fm/)

The MIT license does NOT apply to the name `Feri` or any of the images in this repository. Those items are strictly copyrighted to Kai Nightmode.