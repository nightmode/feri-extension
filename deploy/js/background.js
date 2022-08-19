'use strict'

//-------
// Notes
//-------
/*
    Feri Extension uses camel case for variables.
*/

//-----------
// Variables
//-----------
const local = {
    'function': { // will hold various functions
        // addListeners
        // checkConnection
        // connect
        // connectionError
        // disconnect
        // extensionOff
        // extensionOn
        // fixIcons
        // listenerPortConnect
        // listenerPortDisconnect
        // listenerPortMessage
        // listenerTabsUpdated
        // listenerWindowBeforeUnload
        // lostConnection
        // optionsFromStorage
        // optionsToStorage
        // optionToStorage
        // portMessageAll
        // portMessageAllExcept
        // reload
        // reloadResume
        // reloadResumeFinal
        // resetMostSettings
        // setBadge
        // setIcon
        // start
        // storageGet
        // storageSet
        // tabRemoved
        // test
        // themeCheck
        // themeMonitor
    },
    'option': { // defaults for user customizable values which may get replaced with values from storage
        'port'  : '4000',
        'server': 'local.test'
    },
    'port': [], // array of port objects used to communicate with other scripts
    'setting': { // settings used internally, not customizable by the user
        'defaultDocument': 'index.html', // can be changed by sock.onmessage
        'reloadRequest': 0, // will be incremented by one for each reload request that comes in during an active reload
        'scrollAfterReload': false, // will be set to true if a document should scroll to its last known scroll offset after a reload
        'scrollError': {
            'scrollLeft': 0, // last known left scroll offset for a document that scrolling could not be restored for
            'scrollTop': 0, // last known top scroll offset for a document that scrolling could not be restored for
            'tabURL': '' // can be set to an URL by reloadResumeFinal() if a scrollRestoration setting for a document could not be restored to "auto"
        },
        'scrollLeft': 0, // last known left scroll offset of a document in pixels, relayed from "reload-before.js" before a tab reloads
        'scrollRestoration': 'auto', // last known scroll restoration setting of a document, relayed from "reload-before.js" before a tab reloads
        'scrollTop': 0, // last known top scroll offset of a document in pixels, relayed from 'reload-before.js' before a tab reloads
        'tabID': 0, // will be set to a positive integer once the extension is on and listening for changed files from the build tool
        'tabURL': '', // will be set to the URL of a tab by listenerTabsUpdated()
        'windowID': 0 // will be set to a positive integer once the extension is on and listening for changed files from the build tool
    },
    'sock': undefined, // will be an instance of WebSocket once a connection is attempted or connected
    'status': {
        'connectAbort': false, // can be set to true if disconnect request is received before a connection is fully established
        'current': 'disconnected', // current or last known status
        'lastIconCustomColor': '', // will be a string like blue or pink
        'pingAttempt': 0 // will increment every time a ping request is sent from the extension, will be reset to 0 when a pong response is received from the server
    },
    'test': { // functions which will be populated by "background-test.js" once "await test()" is run
        // functions
        // function * (tests for various functions under local.function)
        // option
        // port
        // setting
        // sharedFunction (test for shared.function)
        // sharedFunction * (tests for various functions under shared.function)
        // sharedSetting (test for shared.setting)
        // sock
        // status
        // test
        // timer
        // theme
        // troubleshoot
    },
    'timer': { // setInterval and setTimeout references
        'ping': null, // will become a setInterval call to run checkConnection() every 10 seconds once a websocket is open
        'themeMonitor': '' // will become a setTimeout call to run themeMonitor() every 10 seconds
    },
    'theme': {
        'matchMediaDark': window.matchMedia('(prefers-color-scheme: dark)'), // reference this object since we will be checking it frequently
        'isDark': false // can be set to true by themeCheck()
    },
    'troubleshoot': null // generic troubleshooting placeholder
} // local

//-----------
// Functions
//-----------
const addListeners = local.function.addListeners = function addListeners() {
    /*
    Add various listeners.
    */

    browser.runtime.onConnect.addListener(listenerPortConnect)

    browser.tabs.onUpdated.addListener(listenerTabsUpdated)

    window.addEventListener('beforeunload', listenerWindowBeforeUnload)

    log('addListeners -> listeners active')
} // addListeners

const checkConnection = local.function.checkConnection = async function checkConnection() {
    /*
    Check the websocket connection and call disconnect() and lostConnection() if three or more ping attempts fail or if the websocket is no longer open.
    */

    if (local.status.pingAttempt >= 3) {
        log('checkConnection -> three or more ping attempts failed')
        await disconnect() // disconnect also resets most local.setting properties to default values
        await lostConnection()
    } else {
        if (local.sock && local.sock.readyState === 1) { // open
            local.status.pingAttempt += 1
            local.sock.send("ping")
        } else {
            // websocket is no longer open
            log('checkConnection -> websocket is no longer open')
            await disconnect() // disconnect also resets most local.setting properties to default values
            await lostConnection()
        }
    }
} // checkConnection

const connect = local.function.connect = async function connect() {
    /*
    Try to open a websocket connection and setup websocket listeners.
    */

    // try to disconnect first
    await disconnect() // disconnect also resets most local.setting properties to default values

    if (local.status.connectAbort === true) {
        // we received a disconnect request before a connect could fully establish
        log('connect -> connect abort')
        return 'early'
    }

    try {
        local.sock = new WebSocket('ws://' + local.option.server + ':' + local.option.port)

        local.sock.onerror = async function (event) {
            /*
            Listener for websocket error events.

            @param  {Object}  event  Event object.
            */

            log('websocket -> on error', event)

            local.troubleshoot = event

            clearInterval(local.timer.ping)

            await fixIcons() // fixes the edge case where one tab has a pink error icon and then a failed connection is made in a second tab that would turn a second icon pink

            await connectionError()
        } // sock.onerror

        local.sock.onopen = async function (event) {
            /*
            Listener for websocket open events.

            @param  {Object}  event  Event object.
            */

            // log('websocket -> on open', event)

            // check connection every 10 seconds
            local.timer.ping = setInterval(checkConnection, 10000)

            browser.tabs.onRemoved.addListener(tabRemoved)

            local.status.current = 'connected'

            portMessageAll({
                'subject': 'connected',
                'setting': local.setting,
                'status': {
                    'current': local.status.current
                }
            })

            await setBadge(browser.i18n.getMessage('on'))
            await setIcon('blue', local.setting.tabID)

            await fixIcons() // fixes the edge case where one tab has a pink error icon and then a successful connection is made in a second tab that would turn a second icon blue
        } // sock.onopen

        local.sock.onmessage = async function (event) {
            /*
            Listener for websocket message events.

            @param  {Object}  event  Event object.
            */

            let data = event.data

            try {
                data = JSON.parse(data)
            } catch (error) {
                // do nothing
            }

            // check and optionally set the defaultDocument
            if (data.hasOwnProperty('defaultDocument')) {
                if (typeof data.defaultDocument === 'string') {
                    if (data.defaultDocument.trim().length >= 3) {
                        local.setting.defaultDocument = data.defaultDocument.trim()
                    }
                } // if
            } // if

            // any files built?
            if (data.hasOwnProperty('files')) {
                if (Array.isArray(data.files)) {
                    log('websocket -> reload')
                    await reload()
                }
            }

            if (data === 'ping' || data === 'pong') {
                if (data === 'ping') {
                    // the server wants to know if we are still connected
                    local.sock.send("pong")
                } else {
                    // the server responded with 'pong'
                    local.status.pingAttempt = 0 // reset to 0
                }
            } else {
                log('websocket -> data', data)
            }
        } // sock.onmessage
    } catch (error) {
        log('websocket -> error', error)
        await connectionError()
    }
} // connect

const connectionError = local.function.connectionError = async function connectionError() {
    /*
    Listener for sock.onerror events.
    */

    local.status.current = 'connection_error'

    portMessageAll({
        'subject': 'connection_error',
        'status': {
            'current': local.status.current
        }
    })

    await setBadge(browser.i18n.getMessage('error'))
    await setIcon('pink', local.setting.tabID)
} // connectionError

const disconnect = local.function.disconnect = async function disconnect() {
    /*
    Disconnect a websocket, reset variables, remove a tab listener, and then reset badges and icons.
    */

    clearInterval(local.timer.ping)

    resetMostSettings() // resets all local.setting properties except for defaultDocument, tabID, and windowID

    local.status.pingAttempt = 0 // reset to 0

    browser.tabs.onRemoved.removeListener(tabRemoved)

    local.status.current = 'disconnected'

    if (typeof local.sock === 'object') {
        if (local.sock.readyState === 1 || local.sock.readyState === 0) { // open or connecting
            local.sock.close(1000) // normal closure
        }
    }

    await setBadge()
    await setIcon('', local.setting.tabID)
} // disconnect

const extensionOff = local.function.extensionOff = async function extensionOff() {
    /*
    Disconnect any open websocket, reset variables, and then send a notification to any open popup that the extension is now off.
    */

    local.status.connectAbort = true

    await disconnect() // disconnect also resets most local.setting properties to default values

    local.setting.tabID = 0
    local.setting.windowID = 0

    portMessageAll({
        'subject': 'disconnected',
        'setting': local.setting,
        'status': {
            'current': local.status.current
        }
    })
} // extensionOff

const extensionOn = local.function.extensionOn = async function extensionOn() {
    /*
    Reset a variable and then call connect() to try to connect a websocket.
    */

    local.status.connectAbort = false

    await connect()
} // extensionOn

const fixIcons = local.function.fixIcons = async function fixIcons() {
    /*
    Set the default icon for future tabs and then loop through any current tabs to set their icons.
    */

    // set default icon
    await setIcon()

    // loop through all tabs and fix icons
    const tabs = await browser.tabs.query({})

    tabs.map(async function(tab) {
        if (local.setting.tabID === tab.id) {
            // set colorful icon
            await setIcon(local.status.lastIconCustomColor, tab.id)
        } else {
            // set default icon
            await setIcon('', tab.id)
        }
    })
} // fixIcons

const listenerPortConnect = local.function.listenerPortConnect = function listenerPortConnect(port) {
    /*
    Listener for browser.runtime.onConnect events.

    @param  {Object}  port  Object with the properties onDisconnect, name, sender, onMessage, disconnect, and postMessage.
    */

    log('listenerPortConnect -> connected', port.name)

    local.port.push(port)

    port.onDisconnect.addListener(listenerPortDisconnect)

    port.onMessage.addListener(listenerPortMessage)
} // listenerPortConnect

const listenerPortDisconnect = local.function.listenerPortDisconnect = function listenerPortDisconnect(port) {
    /*
    Listener for port.onDisconnect events.

    @param  {Object}  port  Object with the properties onDisconnect, name, sender, onMessage, disconnect, and postMessage.
    */

    log('listenerPortDisconnect -> disconnected', port.name)

    local.port = local.port.filter(keep => keep !== port)
} // listenerPortDisconnect

const listenerPortMessage = local.function.listenerPortMessage = async function listenerPortMessage(obj, port) {
    /*
    Listener for port.onMessage events.

    @param  {Object}  obj   Object like {subject:'popup_init'}
    @param  {Object}  port  Object with the properties onDisconnect, name, sender, onMessage, disconnect, and postMessage.
    */

    switch (obj.subject) {
        case 'associate_tab':
            log('listenerPortMessage -> associate_tab')

            const previousTabID = local.setting.tabID

            resetMostSettings() // resets all local.setting properties except for defaultDocument, tabID, and windowID

            local.setting.tabID = obj.tabID
            local.setting.windowID = obj.windowID

            await setIcon('', previousTabID)
            await setIcon('blue', local.setting.tabID)

            // send updated setting object to all ports except the port that messaged us
            portMessageAllExcept(port, {
                'subject': 'setting',
                'setting': local.setting
            })

            break
        case 'extension_off':
            log('listenerPortMessage -> extension_off')

            await extensionOff()

            break
        case 'extension_on':
            log('listenerPortMessage -> extension_on')

            local.setting.tabID = obj.tabID
            local.setting.windowID = obj.windowID

            await extensionOn()

            break
        case 'option_set':
            log('listenerPortMessage -> option_set ' + obj.name + ' =', obj.value)

            if (local.option[obj.name] === undefined) {
                // this option does not exist
                log('listenerPortMessage -> this option does not exist')
                break
            }

            if (local.option[obj.name] === obj.value) {
                // this option has not changed
                log('listenerPortMessage -> this option has not changed')
                break
            }

            // save option
            local.option[obj.name] = obj.value

            // save option to storage
            await optionToStorage(obj.name)

            // send updated option to all ports except the port that messaged us
            portMessageAllExcept(port, {
                'subject': 'option_set',
                'name'   : obj.name,
                'value'  : obj.value
            })

            if (local.status.current !== 'disconnected') {
                if (obj.name === 'server' || obj.name === 'port') {
                    // user is changing connection options
                    await extensionOff()
                }
            }

            break
        case 'popup_init':
            log('listenerPortMessage -> popup_init')

            port.postMessage({
                'subject': 'popup_init',
                'option' : local.option,
                'setting': local.setting,
                'status' : {
                    'current': local.status.current
                }
            })

            break
        case 'reload_after':
            log('listenerPortMessage -> reload_after', obj)

            try {
                port.postMessage({
                    'subject': 'reload_after',
                    'scrollError': local.setting.scrollError, // an object with sub properties
                    'scrollLeft': local.setting.scrollLeft,
                    'scrollRestoration': local.setting.scrollRestoration,
                    'scrollTop': local.setting.scrollTop,
                    'tabURL': local.setting.tabURL
                })

                if (local.setting.scrollError.tabURL === local.setting.tabURL) {
                    // reset error settings since the content script has been messaged
                    local.setting.scrollError = {
                        scrollLeft: 0,
                        scrollTop: 0,
                        tabURL: ''
                    }
                } // if
            } catch (error) {
                log('listenerPortMessage -> reload_after -> error', error)
            } // catch

            break
        case 'reload_before':
            log('listenerPortMessage -> reload_before', obj)

            local.setting.scrollLeft = Math.abs(parseInt(obj.scrollLeft, 10)) || 0
            local.setting.scrollTop = Math.abs(parseInt(obj.scrollTop, 10)) || 0

            local.setting.scrollRestoration = (obj.scrollRestoration === 'manual') ? 'manual' : 'auto'

            if (local.setting.scrollRestoration === 'auto' && (local.setting.scrollLeft > 0 || local.setting.scrollTop > 0)) {
                local.setting.scrollAfterReload = true
            } else {
                local.setting.scrollAfterReload = false
            }

            await reloadResume()

            break
        default:
            log('listenerPortMessage -> unknown obj.subject')
            log(obj)

            break
    } // switch
} // listenerPortMessage

const listenerTabsUpdated = local.function.listenerTabsUpdated = async function listenerTabsUpdated(tabID, changeInfo, tab) {
    /*
    Listener for browser.tabs.onUpdated events.

    @param  {Number}  tabID       ID of the tab that was updated.
    @param  {Object}  changeInfo  Tab properties that have changed.
        https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated#changeInfo
    @param  {Object}  tab         The new state of the tab.
        https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
    */

    if (tabID === local.setting.tabID) {
        // re-set the colorful icon for the feri associated tab
        await setIcon(local.status.lastIconCustomColor, local.setting.tabID)

        log('listenerTabsUpdated -> colorful icon re-set')

        if (typeof tab.url === 'string') {
            local.setting.tabURL = tab.url
        }

        if (changeInfo.status === 'complete') {
            if (local.setting.scrollError.tabURL !== '') {
                if (local.setting.scrollError.tabURL !== local.setting.tabURL) {
                    // we have navigated to a new page that is no longer the error URL

                    if (local.setting.scrollError.scrollLeft > 0 || local.setting.scrollError.scrollTop > 0) {
                        // reset the scrollError scrollLeft and scrollTop settings which should no longer be restored
                        local.setting.scrollError.scrollLeft = 0
                        local.setting.scrollError.scrollTop = 0

                        log('listenerTabsUpdated -> reset scrollError scrollLeft and scrollTop which should no longer be restored since the URL changed')
                    }
                } else {
                    // scrollError.tabURL === tabURL

                    // try to set scrollRestoration back to "auto"
                    try {
                        // log('listenerTabsUpdated -> trying to set scrollRestoration back to "auto"')

                        await browser.tabs.executeScript(local.setting.tabID, {
                            file: '/js/reload-after.js'
                        })

                        // set scrollAfterReload to false since we already allowed the document to restore scrolling by executing "reload-after.js" above
                        local.setting.scrollAfterReload = false
                    } catch (error) {
                        log('listenerTabsUpdated -> error', error)
                        // the most likely cause for an error here is trying to executeScript into a page that is not currently available due to a network connection or server issue
                        // we can try to fix the error again the next time a "complete" event happens for this tabURL
                    } // catch
                } // if
            } // if

            // scroll after reload
            if (local.setting.scrollAfterReload === true) {
                local.setting.scrollAfterReload = false

                await reloadResumeFinal()
            }

            // reload request
            if (local.setting.reloadRequest > 1) {
                local.setting.reloadRequest = 0

                log('listenerTabsUpdated -> pending reload requests, calling reload()')

                // initiate exactly one reload for the one or more reload requests that came in while we were working on the previous reload request
                await reload()
            } else {
                local.setting.reloadRequest = 0
            }
        } // if changeInfo.status
    } // if tabID
} // listenerTabsUpdated

const listenerWindowBeforeUnload = local.function.listenerWindowBeforeUnload = function listenerWindowBeforeUnload(event) {
    /*
    Listener for window beforeunload events.

    @param  {Object}  event  Event object.
    */

    // disconnect all ports
    // allows background.js to be reloaded in the inspector since the disconnect event will be seen by connected scripts which will then try to reconnect their port after a short delay
    local.port.forEach(port => port.disconnect())
} // listenerWindowBeforeUnload

const lostConnection = local.function.lostConnection = async function lostConnection() {
    /*
    Set status.current to a lost connection state, notify any open popups about the lost connection, and then set the lost badge and all icons.
    */

    local.status.current = 'lost_connection'

    portMessageAll({
        'subject': 'lost_connection',
        'status': {
            'current': local.status.current
        }
    })

    await setBadge(browser.i18n.getMessage('lost'))
    await setIcon()
} // lostConnection

const optionsFromStorage = local.function.optionsFromStorage = async function optionsFromStorage() {
    /*
    Load local options from storage, if any.
    */

    for (const property in local.option) {
        const storageOption = await storageGet(property)

        if (storageOption !== undefined) {
            local.option[property] = storageOption
        }
    } // for
} // optionsFromStorage

const optionsToStorage = local.function.optionsToStorage = async function optionsToStorage(property) {
    /*
    Save all local options to storage.

    @param  {String}  property  Property name like 'port'.
    */

    for (const property in local.option) {
        await optionToStorage(property)
    } // for
} // optionsToStorage

const optionToStorage = local.function.optionToStorage = async function optionToStorage(property) {
    /*
    Save a single local option to storage.

    @param  {String}  property  Property name like 'port'.
    */

    await storageSet({
        [property]: local.option[property]
    })
} // optionToStorage

const portMessageAll = local.function.portMessageAll = function portMessageAll(obj) {
    /*
    Send an object to all connected ports.

    @param  {Object}  obj  An object.
    */

    for (let i = 0; i < local.port.length; i++) {
        local.port[i].postMessage(obj)
    }
} // portMessageAll

const portMessageAllExcept = local.function.portMessageAllExcept = function portMessageAllExcept(port, obj) {
    /*
    Send an object to all connected ports except one.

    @param  {Object}  port  A port object that should not have anything sent to it.
    @param  {Object}  obj   An object to send.
    */

    for (let i = 0; i < local.port.length; i++) {
        if (local.port[i] !== port) {
            local.port[i].postMessage(obj)
        }
    }
} // portMessageAllExcept

const reload = local.function.reload = async function reload() {
    /*
    If Feri is associated with a tab ID, initiate a reload of that tab.
    */

    if (local.setting.tabID > 0) {
        log('reload -> reload requested for tabID', local.setting.tabID)

        // increment reloadRequest so we can detect if more than one reload request comes in while we are working on a single reload request
        local.setting.reloadRequest += 1

        if (local.setting.reloadRequest > 1) {
            // do nothing since listenerTabsUpdated() will call reload() again once it is done working on a single reload request
            return 'early'
        } // if

        try {
            // get scrollLeft, scrollRestoration, and scrollTop values
            await browser.tabs.executeScript(local.setting.tabID, {
                file: '/js/reload-before.js'
            })

            // reloading will resume in reloadResume() once we receive a message from the "reload-before.js" content script
        } catch (error) {
            // the most likely cause for an error here is trying to executeScript into a protected page like "chrome-extension://..." where content scripts are not allowed
            log('reload -> error', error)
            log('reload -> could not retrieve scrollLeft, scrollRestoration, or scrollTop')
            log('reload -> doing a simple reload')

            await browser.tabs.reload(local.setting.tabID, { bypassCache: true })
        } // catch
    } else {
        log('reload -> tabID is not greater than 0')
    }
} // reload

const reloadResume = local.function.reloadResume = async function reloadResume() {
    /*
    If Feri is associated with a tab ID, resume a reload of that tab.
    */

    if (local.setting.tabID > 0) {
        // chrome returns nearly instantly from the following await, and not after the tab is done reloading like you might think
        await browser.tabs.reload(local.setting.tabID, { bypassCache: true })

        // reloading will resume in reloadResumeFinal() once a tabs.onUpdated event with a status of "complete" happens
    } else {
        log('reloadResume -> tabID is not greater than 0')
    }
} // reloadResume

const reloadResumeFinal = local.function.reloadResumeFinal = async function reloadResumeFinal() {
    /*
    If Feri is associated with a tab ID, finalize a reload of that tab.
    */

    if (local.setting.tabID > 0) {
        // In the case where a scrollRestoration value was "auto", then set to "manual", and then the script below crashes or never runs, that one affected page will keep its "manual" setting. Eventually that page will revert to its natural "auto" setting once navigated to again or navigated to in a fresh tab.

        if (local.setting.scrollRestoration === 'auto' && (local.setting.scrollLeft > 0 || local.setting.scrollTop > 0)) {
            // restore scrollLeft, scrollRestoration, and scrollTop values

            try {
                await browser.tabs.executeScript(local.setting.tabID, {
                    file: '/js/reload-after.js'
                })
            } catch (error) {
                log('reloadResumeFinal -> error', error)
                // the most likely cause for an error here is trying to executeScript into a page that is not currently available due to a network connection or server issue

                // set error settings for possible future use
                local.setting.scrollError = {
                    scrollLeft: local.setting.scrollLeft,
                    scrollTop: local.setting.scrollTop,
                    tabURL: local.setting.tabURL
                }
            } // catch
        } // if
    } else {
        log('reloadResumeFinal -> tabID is not greater than 0')
    }
} // reloadResumeFinal

const resetMostSettings = local.function.resetMostSettings = function resetMostSettings() {
    /*
    Reset most settings to default values.
    */

    // leave defaultDocument as is
    local.setting.reloadRequest = 0
    local.setting.scrollAfterReload = false
    local.setting.scrollError = {
        scrollLeft: 0,
        scrollTop: 0,
        tabURL: ''
    }
    local.setting.scrollLeft = 0
    local.setting.scrollRestoration = 'auto'
    local.setting.scrollTop = 0
    // leave tabID as is
    local.setting.tabURL = ''
    // leave windowID as is
} // resetMostSettings

const setBadge = local.function.setBadge = async function setBadge(text) {
    /*
    Set the badge text and default background color.

    @param  {String}  [text]  Optional badge text string like 'lost'. Defaults to an empty string.
    */

    text = text || ''

    await browser.browserAction.setBadgeText({
        'text': text
    })

    await browser.browserAction.setBadgeBackgroundColor({
        'color': '#313639'
    })
} // setBadge

const setIcon = local.function.setIcon = async function setIcon(color, tabID) {
    /*
    Set an icon for one specific tab or all tabs.

    @param {String}  [color]  Optional color string like 'pink'. Defaults to 'white' or 'gray' depending on the theme preference of the browser.
    @param {Number}  [tabID]  Optional tab ID to set an icon for. Defaults to 0 which means update all tabs.
    */

    color = color || ''
    tabID = tabID || 0

    if (color === '') {
        if (local.theme.isDark === true) {
            color = 'white'
        } else {
            color = 'gray'
        }
    } else {
        local.status.lastIconCustomColor = color
    }

    await browser.browserAction.setIcon({
        'path': {
            '16':  'images/icon/icon-' + color + '-16.png',
            '24':  'images/icon/icon-' + color + '-24.png',
            '32':  'images/icon/icon-' + color + '-32.png',
            '48':  'images/icon/icon-' + color + '-48.png',
            '64':  'images/icon/icon-' + color + '-64.png',
            '96':  'images/icon/icon-' + color + '-96.png',
            '128': 'images/icon/icon-' + color + '-128.png'
        },
        'tabId': (tabID > 0) ? tabID : null
    })
} // setIcon

const start = local.function.start = async function start() {
    /*
    Start.
    */

    await optionsFromStorage() // 0, 1, or more options may come from storage

    // save all options to disk for next time
    await optionsToStorage()

    addListeners()

    await themeMonitor() // will run once and then keep running once every 10 seconds
} // start

const storageGet = local.function.storageGet = async function storageGet(key) {
    /*
    Get a value from storage by providing a named key.

    @param   {String}  key  String like "server".
    @return  {*}            Boolean, Object, Number, or String.
    */

    let obj = await browser.storage.local.get(key)
    // obj can be an empty object {}
    // obj will never be undefined
    return obj[key] // an object key can be undefined
} // storageGet

const storageSet = local.function.storageSet = async function storageSet(obj) {
    /*
    Save an object to storage.

    @param  {Object}  obj  Object like {port:4000}
    */

    await browser.storage.local.set(obj)
} // storageSet

const tabRemoved = local.function.tabRemoved = async function tabRemoved(tabID) {
    /*
    Listener for browser.tabs.onRemoved events.

    @param {Number}  tabID  ID of the closed tab.
    */

    if (local.setting.tabID === tabID) {
        // we were associated with the tab that was just removed
        local.setting.tabID = 0
        local.setting.windowID = 0

        await disconnect() // disconnect also resets most local.setting properties to default values

        log('tabRemoved -> disconnected')
    } else {
        log('tabRemoved -> nothing to do')
    }
} // tabRemoved

const test = local.function.test = async function test() {
    /*
    Run all tests.

    Note: Testing functions will be added to our local.test object once "background-test.js" is lazy loaded by this function.
    */

    let numberOfTests = Object.keys(local.test).length

    if (numberOfTests === 0) {
        // lazy load tests from 'background-test.js'

        await new Promise(function(resolve, reject) {
            const script = document.createElement('script')

            document.getElementsByTagName('head')[0].appendChild(script)

            script.onload = function() {
                resolve()
            }

            script.src = '/js/background-test.js'
        })

        numberOfTests = Object.keys(local.test).length
    } // if

    try {
        for (const property in local.test) {
            try {
                await local.test[property]()
            } catch (error) {
                console.warn('test -> error in local.test.' + property)
                throw error
            }
        } // for

        console.log('test -> all ' + numberOfTests + ' tests passed')
    } catch (error) {
        console.error(error)
    }
} // test

const themeCheck = local.function.themeCheck = async function themeCheck() {
    /*
    Check if the current browser theme is dark or light and call setIcon() if needed.
    */

    const isDark = (local.theme.matchMediaDark.matches) ? true : false

    // Chrome/Edge on macOS notices operating system set light/dark preferences in real time.
    // Firefox on macOS does not notice changes until Firefox is restarted.

    if (local.theme.isDark !== isDark) {
        local.theme.isDark = isDark
        await fixIcons()
    }
} // themeCheck

const themeMonitor = local.function.themeMonitor = async function themeMonitor() {
    /*
    Monitor for theme changes by running themeCheck() once every 10 seconds.
    */

    clearTimeout(local.timer.themeMonitor)

    // background.js does not support matchMedia events in Chrome 76 so we must check the theme manually
    await themeCheck()

    local.timer.themeMonitor = setTimeout(themeMonitor, 10000) // 10 seconds
} // themeMonitor

//-------
// Start
//-------
start()