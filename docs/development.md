# Feri Extension - Development

Development guide for the Feri web browser extension that connects to [Feri](https://github.com/nightmode/feri) and automatically reloads a browser tab when files change.

## Navigation

* [Overview](../README.md#overview)
* [Install](../README.md#install)
* [Usage](usage.md#usage)
* Development
* [Deploy](deploy.md#deploy)
* [Thanks](../README.md#thanks)
* [Support](../README.md#support)

## Development

Instructions for anyone who will be working with or forking this repo.

No matter which platoform you are developing on, make sure the `debug` setting inside `deploy/js/background.js` is set to `true`. This will enable various console logging and in Chrome, allow you to inspect the extension popup window.

**Warning:** With debug set to true, you can trigger simultaneous extension popups if you have two or more windows. This leads to an edge case where only one of the simultaneous extension popups will work.

### Development in Chrome

Navigate to `chrome://extensions` and enable `developer mode`.

Use `load unpacked` and select `deploy` as the extension folder.

### Development in Firefox

Navigate to `about:debugging` and enable `add-on debugging`.

Use `load temporary add-on` and select the `manifest.json` file within the `deploy` folder.

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)