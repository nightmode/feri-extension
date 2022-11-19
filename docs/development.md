# Feri Extension - Development

Development guide for the Feri browser extension that connects to the [Feri](https://github.com/nightmode/feri) build tool and automatically reloads a browser tab when files change.

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

No matter which platform you are developing on, make sure `local.setting.log` is `true` in `deploy/js/shared.js`. This will enable console logging for development.

As you develop, you may want to run a suite of tests to make sure everything is working as intended. The suite of tests can be run by entering `await test()` in the console of the background page. The Feri build tool will need to be running and reachable in order for tests to pass.

You will probably want to add or modify tests from time to time too. Each test can be found in `deploy/js/background-test.js`. Keep in mind that tests are only focused on scripts used by the background page, namely `deploy/js/background.js` and `deploy/js/shared.js`.

The test suite is no replacement for human testing of course.

### Development in Chrome

Navigate to `chrome://extensions` and enable `developer mode`.

Use `load unpacked` and select `deploy` as the extension folder.

### Development in Edge

Navigate to `edge://extensions/` and enable `developer mode`.

Use `load unpacked` and select `deploy` as the extension folder.

### Development in Firefox

Navigate to `about:debugging` and enable `add-on debugging`.

Use `load temporary add-on` and select the `manifest.json` file within the `deploy` folder.

## License

MIT © [Kai Nightmode](https://nightmode.fm/)

The MIT license does NOT apply to the name `Feri` or any of the images in this repository. Those items are strictly copyrighted to Kai Nightmode.