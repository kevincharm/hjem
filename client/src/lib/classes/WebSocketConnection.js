/**
 *  WebSocketConnection
 *  A wrapper over WebSocket that handles reconnection, and keeps
 *  a reference to the Redux store so that it can be used as middleware.
 *  Should be instantiated in ../ducks/wsConnection.js
 */
export default class WebSocketConnection {
    constructor(address) {
        this.address = address
        this.onErrorHandlers = []
        this.onOpenHandlers = []
        this.onCloseHandlers = []
        this.onMessageHandlers = []

        if (window.WebSocket) {
            this.connect()
        } else {
            this.triggerErrorHandlers({ message: 'WebSocket not supported!' })
        }
    }

    setStore(reduxStore) {
        this.dispatch = reduxStore.dispatch
        this.getState = reduxStore.getState
    }

    connect() {
        try {
            this.ws = null
            this.ws = new window.WebSocket(this.address)
            this.ws.onerror = (...args) => this.triggerErrorHandlers(...args)
            this.ws.onopen = (...args) => this.triggerOpenHandlers(...args)
            this.ws.onclose = (...args) => this.triggerCloseHandlers(...args)
            this.ws.onmessage = (...args) => this.triggerMessageHandlers(...args)
        } catch (e) {
            console.log(e)
            this.triggerErrorHandlers({ message: 'Could not create a WebSocket instance!' })
        }
    }

    triggerErrorHandlers(...args) {
        this.onErrorHandlers.forEach(h => h(...args))
    }

    onError(cb) {
        if (typeof cb === 'function') this.onErrorHandlers.push(cb)
    }

    triggerOpenHandlers(...args) {
        this.onOpenHandlers.forEach(h => h(...args))
    }

    onOpen(cb) {
        if (typeof cb === 'function') this.onOpenHandlers.push(cb)
    }

    triggerCloseHandlers(...args) {
        this.onCloseHandlers.forEach(h => h(...args))
        setTimeout(() => this.connect(), 5000)
    }

    onClose(cb) {
        if (typeof cb === 'function') this.onCloseHandlers.push(cb)
    }

    triggerMessageHandlers(...args) {
        this.onMessageHandlers.forEach(h => h(...args))
    }

    onMessage(cb) {
        if (typeof cb === 'function') this.onMessageHandlers.push(cb)
    }

    send(...args) {
        if (!this.ws) return this.triggerErrorHandlers({ message: 'WebSocket not ready!' })

        if (this.ws.readyState) {
            return this.ws.send(...args)
        }

        return setTimeout(() => {
            this.send(...args)
        }, 10)
    }
}
