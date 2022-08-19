'use strict'

//-------
// Notes
//-------
/*
    The window object is safe to use because our script will be injected and isolated from any existing scripts.
*/

//--------------------------------
// This script will only run once
//--------------------------------
if (window.reloadAfter === undefined) {
    window.reloadAfter = true

    window.reloadAfterDone = false // used by "reload-before.js" to wait before reading values that are not restored yet

    //-----------
    // Variables
    //-----------
    const browserAlias = (typeof browser === 'object') ? browser : chrome // firefox or a chromium based browser

    const port = browserAlias.runtime.connect({ name: 'reload-after' })

    //-----------
    // Functions
    //-----------
    const listenerPortMessage = function listenerPortMessage(obj, port) {
        /*
        Listener for port.onMessage events.

        @param  {Object}  obj   Object like {subject:'reload_after'}
        @param  {Object}  port  Object with the properties onDisconnect, name, sender, onMessage, disconnect, and postMessage.
        */

        switch (obj.subject) {
            case 'reload_after':
                const currentURL = window.location.href

                if (obj.scrollError.tabURL !== '' && obj.scrollError.tabURL === currentURL) {
                    // manually set "auto" to match the last known scrollRestoration setting of the document
                    window.history.scrollRestoration = 'auto'

                    // override normal settings with last known error settings
                    obj.scrollLeft = obj.scrollError.scrollLeft
                    obj.scrollRestoration = 'auto'
                    obj.scrollTop = obj.scrollError.scrollTop
                } // if

                if (obj.tabURL === currentURL) {
                    if (obj.scrollRestoration === 'auto' && (obj.scrollLeft > 0 || obj.scrollTop > 0)) {
                        window.scroll({
                            behavior: 'auto', // auto as in move instantly, do not smooth scroll
                            left: obj.scrollLeft,
                            top: obj.scrollTop
                        })

                        if (window.history.scrollRestoration !== 'auto') {
                            window.history.scrollRestoration = 'auto'
                        }
                    } // if
                } // if

                port.disconnect()

                // let "reload-before.js" know that it is safe to read restored values now
                window.reloadAfterDone = true

                break
            default:
                // ignore all other messages
                break
        } // switch
    } // listenerPortMessage

    const start = function start() {
        /*
        Start.
        */

        // listen for messages from the background script
        port.onMessage.addListener(listenerPortMessage)

        // message the background script
        port.postMessage({
            'subject': 'reload_after'
        })
    } // start

    //-------
    // Start
    //-------
    start()
} // if