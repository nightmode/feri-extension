# Feri Extension - Usage

Usage guide for the Feri browser extension that connects to the [Feri](https://github.com/nightmode/feri) build tool and automatically reloads a browser tab when files change.

## Navigation

* [Overview](../README.md#overview)
* [Install](../README.md#install)
* Usage
  * [Config, Connect, and Disconnect](#usage)
  * [Connection Error](#connection-error)
  * [Lost Connection](#lost-connection)
  * [Tab Association](#tab-association)
* [Development](development.md#development)
* [Deploy](deploy.md#deploy)
* [Thanks](../README.md#thanks)
* [Support](../README.md#support)

## Usage

Find the Feri icon in your browser toolbar. It should look similar to a browser reload icon.

|Icon|Description|
|:---:|:---|
| <img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-gray-48.png" width="24" height="24" align="" alt=""> | By default, the Feri icon will be colorless which indicates a disconnected or lost connection state. For a lost connection state, a text badge "lost" will display on all tabs. |
| <img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-blue-48.png" width="24" height="24" align="" alt=""> | Once a connection is made, the icon for the associated browser tab will turn blue. A text badge "on" will display on all tabs.|
| <img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-pink-48.png" width="24" height="24" align="" alt=""> | If a connection attempt fails, the icon for the associated browser tab will turn pink. A text badge "error" will display on all tabs. |

Any non-associated tabs will always have colorless icons, no matter the state.

## Config, Connect, and Disconnect

Click the Feri icon and you will see the following screen.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/disconnected.png" width="318" height="354" align="" alt="">

If this is your first time using Feri, you'll want to check the config screen before attempting a connection.

Click the config button (blue wrench below).

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/config-hover.png" width="318" height="354" align="" alt="">

The config screen allows you to set an extension server address and port number.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/config.png" width="318" height="354" align="" alt="">

By default, Feri prefers **local.test** port **4000** for local development. Using the top-level domain [.test](https://en.wikipedia.org/wiki/.test) comes with advantages that makes it worth the effort it takes to add an entry to your [hosts](https://en.wikipedia.org/wiki/Hosts_(file)) file.

For non-local testing, any network that allows WebSocket connections to the chosen extension server and port is all that is required.

Once you are happy with your settings, click the save button (blue disk below).

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/config-save-hover.png" width="318" height="354" align="" alt="">

A config saved screen should be displayed.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/config-saved.png" width="318" height="354" align="" alt="">

Make sure the Feri build tool is running and then click the connect button (blue icon below).

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/connect-hover.png" width="318" height="354" align="" alt="">

A connected screen should be displayed.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/connected.png" width="318" height="354" align="" alt="">

In addition to the screen above, the Feri icon associated for this browser tab will turn blue to indicate an active connection.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-blue-48.png" width="24" height="24" align="" alt="">

At this point, everything is connected and any file changes in the Feri build tool will trigger a reload of the associated browser tab.

Once you are done working on files, you can click the disconnect button (blue skull below).

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/disconnect-hover.png" width="318" height="354" align="" alt="">

A disconnected screen should be displayed.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/disconnected.png" width="318" height="354" align="" alt="">

The Feri icon will also revert to gray to indicate a disconnected state.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-gray-48.png" width="24" height="24" align="" alt="">

---

### Connection Error

A connection error will happen after a failed connection attempt. Most of the time you will see the screen below immediately after clicking the connect button.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/connection-error.png" width="318" height="354" align="" alt="">

Feri associated tabs will also display a pink icon in your browser toolbar to indicate a connection error.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-pink-48.png" width="24" height="24" align="" alt="">

Non-associated tabs will have a gray icon overlaid with a tiny "error" badge.

To resolve a connection error, consider the following.

* Is the Feri build tool is running with the `--extensions` option or its equivalent?
* Is the extension server and port number in the error message correct?
* Is the extension server configured with a domain name?
  * If yes, can you resolve the IP for the domain name?
  * If yes, can you reach the extension server via the IP?
* Are you using a special, low, or reserved port number?
* Are there any browser network or security settings that can be changed?
* Are there firewalls or other security devices on the path from the client through the network to the server?
* Have you made the correct offerings to [Zuul](https://ghostbusters.fandom.com/wiki/Zuul) the Gatekeeper of Gozer?

In any case, you can access the config screen to try a different setting and/or click the connect button to try again.

---

### Lost Connection

Once connected, the extension server and client routinely ping each other to ensure a good connection. If enough pings fail in a row, a lost connection will occur.

Once a lost connection occurs, every Feri icon in every browser tab will turn gray and get overlaid with a "lost" text badge.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-gray-48.png" width="24" height="24" align="" alt="">

Clicking the Feri icon will reveal a lost connection screen.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/lost-connection.png" width="318" height="354" align="" alt="">

At this point, make sure the Feri build tool is running and if it is, try to reconnect.

---

### Tab Association

Feri likes being associated with one browser tab only. As in, only one browser tab can reload automatically when files change.

|Icon|Description|
|:---:|:---|
| <img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-blue-48.png" width="24" height="24" align="" alt=""> | A browser tab that is associated with Feri and actively connected will have a blue icon. |
| <img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/icon-gray-48.png" width="24" height="24" align="" alt=""> | A browser tab that is connected but NOT associated with Feri will have a gray icon. |

As long as there is a connection, clicking on a gray icon will result in the special connected screen below.

<img src="https://raw.githubusercontent.com/nightmode/feri-extension/main/images/docs/associate.png" width="318" height="354" align="" alt="">

Besides the normal disconnect and config buttons, there are also two unique links.

* "Associate with this tab" will promote this tab to an active association. As a visual confirmation, the previously gray icon for this browser tab will turn blue.
* The "return to the associated tab" link will change your focus to the previously associated tab. Even if that tab was in another window.

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)

The MIT license does NOT apply to the name `Feri` or any of the images in this repository. Those items are strictly copyrighted to Kai Nightmode.