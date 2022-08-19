'use strict'

//-----------
// Variables
//-----------
const local = {
    'class': { // will hold various classes
        // customInputNumber
        // customInputText
    },
    'element': {
        'buttonConfig'    : document.getElementById('button_config'),
        'buttonConnect'   : document.getElementById('button_connect'),
        'buttonDisconnect': document.getElementById('button_disconnect'),
        'buttonReconnect' : document.getElementById('button_reconnect'),
        'buttonSave'      : document.getElementById('button_save'),
        'configArea'      : document.getElementById('config_area'),
        'displayAssociate': document.getElementById('display_associate'),
        'displayError'    : document.getElementById('display_error'),
        'displayStatus'   : document.getElementById('display_status'),
        'inputPort'       : document.getElementById('input_port'),
        'inputServer'     : document.getElementById('input_server')
    },
    'function': { // will hold various functions
        // addListeners
        // clearAssociate
        // clearError
        // customElementsDefine
        // listenerButtonConfigClick
        // listenerButtonConnectClick
        // listenerButtonDisconnectClick
        // listenerButtonReconnectClick
        // listenerButtonSaveClick
        // listenerPortDisconnect
        // listenerPortMessage
        // portConnect
        // portListeners
        // portRequestPopupInit
        // setStatus
        // start
        // startContinue
    },
    'option': { // will be retrieved by sending a message to background.js
        // port
        // server
    },
    'popup': { // information about this popup
        'tabID'   : 0, // will be set to the current tab ID
        'windowID': 0  // will be set to the current window ID
    },
    'port': null, // will be set by portConnect() and used to communicate with background.js
    'setting': { // will be retrieved by sending a message to background.js
        // defaultDocument
        // tabID
        // windowID
    },
    'status': { // will be retrieved by sending a message to background.js
        // current
    },
    'troubleshoot': null // generic troubleshooting placeholder
} // local

//---------
// Classes
//---------
const customInputNumber = local.class.customInputNumber = class customInputNumber extends HTMLInputElement {
    /*
    Custom input number element.
    */

    constructor() {
        super() // setup object inheritance

        const property = this.dataset.option // for example, port for local.option.port

        // set initial state
        if (this.placeholder === local.option[property]) {
            // prefer placeholder for default values
            this.value = ''
        } else {
            this.value = local.option[property]
        }

        this.addEventListener('input', function(event) {
            event.stopPropagation()

            if (this.value < 1 || this.value === this.placeholder) {
                this.value = ''
            }

            // set local option
            local.option[property] = this.value || this.placeholder

            // relay option to background.js
            const message = {
                'subject': 'option_set',
                'name'   : property,
                'value'  : local.option[property]
            }

            local.port.postMessage(message)
        })

        this.addEventListener('keydown', function(event) {
            event.stopPropagation()

            if (event.key === 'Enter') {
                local.element.buttonSave.click()
            }

            if (event.key === 'Tab') {
                event.preventDefault()
                local.element.inputServer.focus()
            }
        })
    } // constructor
} // customInputNumber

const customInputText = local.class.customInputText = class customInputText extends HTMLInputElement {
    /*
    Custom input text element.
    */

    constructor() {
        super() // setup object inheritance

        const property = this.dataset.option // for example, server for local.option.server

        // set initial state
        if (this.placeholder === local.option[property]) {
            // prefer placeholder for default values
            this.value = ''
        } else {
            this.value = local.option[property]
        }

        this.addEventListener('input', function(event) {
            event.stopPropagation()

            const cleanValue = this.value.replace(/:/g, '').replace(/ /g, '')

            if (this.value !== cleanValue) {
                this.value = cleanValue
            }

            if (this.value === this.placeholder) {
                this.value = ''
            }

            // set local option
            local.option[property] = this.value || this.placeholder

            // relay option to background.js
            const message = {
                'subject': 'option_set',
                'name'   : property,
                'value'  : local.option[property]
            }

            local.port.postMessage(message)
        })

        this.addEventListener('keydown', function(event) {
            event.stopPropagation()

            if (event.key === 'Enter') {
                local.element.buttonSave.click()
            }
        })
    } // constructor
} // customInputText

//-----------
// Functions
//-----------
const addListeners = local.function.addListeners = function addListeners() {
    /*
    Add event listeners.
    */

    local.element.buttonConfig.addEventListener('click', listenerButtonConfigClick)
    local.element.buttonConnect.addEventListener('click', listenerButtonConnectClick)
    local.element.buttonDisconnect.addEventListener('click', listenerButtonDisconnectClick)
    local.element.buttonReconnect.addEventListener('click', listenerButtonReconnectClick)
    local.element.buttonSave.addEventListener('click', listenerButtonSaveClick)
} // addListeners

const clearAssociate = local.function.clearAssociate = function clearAssociate() {
    /*
    Hide and then clear the "associate with this tab" area.
    */

    local.element.displayAssociate.style.display = 'none'

    // loop through and remove any sub elements
    while (local.element.displayAssociate.lastChild) {
        local.element.displayAssociate.removeChild(local.element.displayAssociate.lastChild)
    }
} // clearAssociate

const clearError = local.function.clearError = function clearError() {
    /*
    Hide and then clear the error area.
    */

    local.element.displayError.style.display = 'none'

    // loop through and remove any sub elements
    while (local.element.displayError.lastChild) {
        local.element.displayError.removeChild(local.element.displayError.lastChild)
    }
} // clearError

const customElementsDefine = local.function.customElementsDefine = function customElementsDefine() {
    /*
    Define Custom Elements for programmatic use and also upgrade any existing HTML elements with matching "is" properties.
    */

    customElements.define('custom-input-number', customInputNumber, { extends: 'input' })
    customElements.define('custom-input-text', customInputText, { extends: 'input' })
} // customElementsDefine

const listenerButtonConfigClick = local.function.listenerButtonConfigClick = async function listenerButtonConfigClick(event) {
    /*
    Listener for element.buttonConfig click events.

    @param  {Object}  event  Not used. Event object.
        https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
    */

    clearError()

    local.element.configArea.style.display = 'block'

    local.element.buttonConfig.style.display = 'none'
    local.element.buttonSave.style.display = 'inline-block'

    // message for background.js
    const message = {
        'subject': 'extension_off'
    }

    local.port.postMessage(message)

    local.element.displayStatus.textContent = browser.i18n.getMessage('config')
} // listenerButtonConfigClick

const listenerButtonConnectClick = local.function.listenerButtonConnectClick = async function listenerButtonConnectClick(event) {
    /*
    Listener for element.buttonConnect click events.

    @param  {Object}  event  Not used. Event oject.
        https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
    */

    clearError()

    local.element.buttonConnect.blur()

    local.element.displayStatus.textContent = browser.i18n.getMessage('connecting')

    local.element.buttonConnect.style.display = 'none'
    local.element.buttonDisconnect.style.display = 'inline-block'

    // message for background.js
    const message = {
        'subject' : 'extension_on',
        'tabID'   : local.popup.tabID,
        'windowID': local.popup.windowID
    }

    local.port.postMessage(message)
} // listenerButtonConnectClick

const listenerButtonDisconnectClick = local.function.listenerButtonDisconnectClick = async function listenerButtonDisconnectClick(event) {
    /*
    Listener for element.buttonDisconnect click events.

    @param  {Object}  event  Not used. Event object.
        https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
    */

    clearError()

    local.element.buttonDisconnect.blur()

    // message for background.js
    const message = {
        'subject': 'extension_off'
    }

    local.port.postMessage(message)
} // listenerButtonDisconnectClick

const listenerButtonReconnectClick = local.function.listenerButtonReconnectClick = async function listenerButtonReconnectClick(event) {
    /*
    Listener for element.buttonReconnect click events.

    @param  {Object}  event  Not used. Event object.
        https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
    */

    clearError()

    local.element.buttonReconnect.blur()

    local.element.displayStatus.textContent = browser.i18n.getMessage('connecting')

    local.element.buttonReconnect.style.display = 'none'
    local.element.buttonDisconnect.style.display = 'inline-block'

    // message for background.js
    const message = {
        'subject' : 'extension_on',
        'tabID'   : local.popup.tabID,
        'windowID': local.popup.windowID
    }

    local.port.postMessage(message)
} // listenerButtonReconnectClick

const listenerButtonSaveClick = local.function.listenerButtonSaveClick = function listenerButtonSaveClick(event) {
    /*
    Listener for element.buttonSave click events.

    @param  {Object}  event  Not used. Event object.
        https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
    */

    clearError()

    local.element.displayStatus.textContent = browser.i18n.getMessage('configSaved')

    local.element.configArea.style.display = 'none'

    local.element.buttonConfig.style.display = 'inline-block'
    local.element.buttonSave.style.display = 'none'
} // listenerButtonSaveClick

const listenerPortDisconnect = local.function.listenerPortDisconnect = function listenerPortDisconnect() {
    /*
    Listener for local.port.onDisconnect events.
    */

    log('listenerPortDisconnect -> disconnected')

    setTimeout(function() {
        portConnect()
        portListeners()
    }, 1000)
} // listenerPortDisconnect

const listenerPortMessage = local.function.listenerPortMessage = async function listenerPortMessage(obj, info) {
    /*
    Listener for local.port.onMessage events.

    @param  {Object}  obj   Object like {subject:'option-and-status'}
    @param  {Object}  info  Not used. Object with the properties disconnect, name, onDisconnect, onMessage, postMessage, and sender.
    */

    switch (obj.subject) {
        case 'connected':
            log('listenerPortMessage -> connected')

            local.setting = obj.setting
            local.status  = obj.status

            setStatus()

            break
        case 'connection_error':
            log('listenerPortMessage -> connection_error')

            local.status = obj.status

            setStatus()

            break
        case 'disconnected':
            log('listenerPortMessage -> disconnected')

            local.setting = obj.setting
            local.status  = obj.status

            setStatus()

            break
        case 'lost_connection':
            log('listenerPortMessage -> lost_connection')

            local.status = obj.status

            setStatus()

            break
        case 'option_set':
            log('listenerPortMessage -> option_set -> ' + obj.name + ' =', obj.value)

            local.option[obj.name] = obj.value

            // find element to update
            const element = document.querySelector('[data-option=' + obj.name + ']')

            // update element
            if (element.type === 'number' || element.type === 'text') {
                element.value = obj.value

                if (element.placeholder === obj.value) {
                    // prefer placeholder for default values
                    element.value = ''
                } else {
                    element.value = obj.value
                }
            } else {
                log('listenerPortMessage -> option_set -> error -> unknown type ' + element.type)
            }

            break
        case 'popup_init':
            log('listenerPortMessage -> popup_init')

            local.option  = obj.option
            local.setting = obj.setting
            local.status  = obj.status

            startContinue()

            break
        case 'setting':
            log('listenerPortMessage -> setting')

            local.setting = obj.setting

            setStatus()

            break
        default:
            log('listenerPortMessage -> unknown obj.subject', obj)

            break
    } // switch
} // listenerPortMessage

const portConnect = local.function.portConnect = function portConnect() {
    /*
    Connect a port to the background script.
    */

    local.port = browser.runtime.connect({ name: 'popup' })
} // portConnect

const portListeners = local.function.portListeners = function portListeners() {
    /*
    Add port event listeners.
    */

    local.port.onMessage.addListener(listenerPortMessage)

    local.port.onDisconnect.addListener(listenerPortDisconnect)

    log('portListeners -> active')
} // portListeners

const portRequestPopupInit = local.function.portRequestPopupInit = function portRequestPopupInit() {
    /*
    Send a request message to the background script for the local.option, local.setting, and local.status objects.
    */

    const message = {
        'subject': 'popup_init'
    }

    local.port.postMessage(message)
} // portRequestPopupInit

const setStatus = local.function.setStatus = function setStatus() {
    /*
    Set the current status based on the local.status object received from the background script.
    */

    switch(local.status.current) {
        case 'connected':
            local.element.displayStatus.textContent = browser.i18n.getMessage('connected')

            local.element.buttonConnect.style.display = 'none'
            local.element.buttonDisconnect.style.display = 'inline-block'
            local.element.buttonReconnect.style.display = 'none'

            clearError()
            clearAssociate()

            if (local.popup.tabID !== local.setting.tabID) {
                const elementParagraph1 = document.createElement('p')
                elementParagraph1.textContent = browser.i18n.getMessage('notAssociated')

                const elementLink1 = document.createElement('a')
                elementLink1.id = 'associate_here'
                elementLink1.textContent = browser.i18n.getMessage('notAssociatedLinkOne')

                const elementText1 = document.createTextNode(' ' + browser.i18n.getMessage('notAssociatedOr') + ' ')

                const elementLink2 = document.createElement('a')
                elementLink2.id = 'associate_return'
                elementLink2.textContent = browser.i18n.getMessage('notAssociatedLinkTwo')

                const elementText2 = document.createTextNode('.')

                const elementParagraph2 = document.createElement('p')
                elementParagraph2.appendChild(elementLink1)
                elementParagraph2.appendChild(elementText1)
                elementParagraph2.appendChild(elementLink2)
                elementParagraph2.appendChild(elementText2)

                local.element.displayAssociate.appendChild(elementParagraph1)
                local.element.displayAssociate.appendChild(elementParagraph2)

                document.getElementById('associate_here').addEventListener('click', async function(event) {
                    /*
                    Listener for click events.

                    @param  {Object}  event  Event object.
                        https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
                    */

                    event.preventDefault()

                    // message for background.js
                    const message = {
                        'subject' : 'associate_tab',
                        'tabID'   : local.popup.tabID,
                        'windowID': local.popup.windowID
                    }

                    local.port.postMessage(message)

                    window.close()
                })

                document.getElementById('associate_return').addEventListener('click', function(event) {
                    /*
                    Listener for click events.

                    @param  {Object}  event  Event object.
                        https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
                    */

                    event.preventDefault()
                    browser.windows.update(local.setting.windowID, { focused: true })
                    browser.tabs.update(local.setting.tabID, { active: true })
                    window.close()
                })

                local.element.displayAssociate.style.display = 'block'
            }

            break
        case 'connection_error':
            local.element.displayStatus.textContent = browser.i18n.getMessage('connectionError')

            local.element.buttonConnect.style.display = 'inline-block'
            local.element.buttonDisconnect.style.display = 'none'
            local.element.buttonReconnect.style.display = 'none'
            local.element.buttonConfig.style.display = 'inline-block'
            local.element.buttonSave.style.display = 'none'

            config_area.style.display = 'none'

            clearError()
            clearAssociate()

            const elementOne = document.createElement('p')
            elementOne.textContent = browser.i18n.getMessage('connectionHelp').replace('{server}', local.option.server).replace('{port}', local.option.port)

            const elementTwo = document.createElement('p')
            elementTwo.textContent = browser.i18n.getMessage('connectionHelpContinued')

            local.element.displayError.appendChild(elementOne)
            local.element.displayError.appendChild(elementTwo)

            local.element.displayError.style.display = 'block'

            break
        case 'disconnected':
            if (local.element.displayStatus.textContent === browser.i18n.getMessage('config') || local.element.displayStatus.textContent === browser.i18n.getMessage('configSaved')) {
                // ok to leave these messages in place
            } else {
                // set disconnected message
                local.element.displayStatus.textContent = browser.i18n.getMessage('disconnected')
            }

            local.element.buttonConnect.style.display = 'inline-block'
            local.element.buttonDisconnect.style.display = 'none'
            local.element.buttonReconnect.style.display = 'none'

            clearError()
            clearAssociate()

            break
        case 'lost_connection':
            local.element.displayStatus.textContent = browser.i18n.getMessage('lostConnection')

            local.element.buttonConnect.style.display = 'none'
            local.element.buttonDisconnect.style.display = 'none'
            local.element.buttonReconnect.style.display = 'inline-block'

            clearError()
            clearAssociate()

            break
        default:
            log('setStatus -> unrecognized status', status)

            break
    } // switch
} // setStatus

const start = local.function.start = async function start() {
    /*
    Start.
    */

    addListeners()

    portConnect()
    portListeners()

    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    local.popup.tabID = tabs[0].id

    const win = await browser.windows.getCurrent()
    local.popup.windowID = win.id

    // request data from background.js
    portRequestPopupInit()

    // startup will continue in startContinue() once our local.option, local.setting, and local.status objects have been set
} // start

const startContinue = local.function.startContinue = function startContinue() {
    /*
    Continue to start the popup page now that the local option, setting, and status objects are available.
    */

    customElementsDefine()
    setStatus()
} // startContinue

//-------
// Start
//-------
start()