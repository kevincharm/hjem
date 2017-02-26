/**
 *  WebSocketConnection
 *  A wrapper over WebSocket that handles reconnection, and keeps
 *  a reference to the Redux store so that it can be used as middleware.
 *  Should be instantiated in ../ducks/wsConnection.js
 */
export default class WebSocketConnection {
    constructor(address) {
        this._address = address
        this._onErrorHandlers = []
        this._onOpenHandlers = []
        this._onCloseHandlers = []
        this._onMessageHandlers = []

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
            this._ws = null
            this._ws = new window.WebSocket(this._address)
            this._ws.onerror = (...args) => this.triggerErrorHandlers(...args)
            this._ws.onopen = (...args) => this.triggerOpenHandlers(...args)
            this._ws.onclose = (...args) => this.triggerCloseHandlers(...args)
            this._ws.onmessage = (...args) => this.triggerMessageHandlers(...args)
        } catch (e) {
            console.log(e)
            this.triggerErrorHandlers({ message: 'Could not create a WebSocket instance!' })
        }
    }

    triggerErrorHandlers(...args) {
        this._onErrorHandlers.forEach(h => h(...args))
    }

    onError(cb) {
        if (typeof cb === 'function') this._onErrorHandlers.push(cb)
    }

    triggerOpenHandlers(...args) {
        this._onOpenHandlers.forEach(h => h(...args))
    }

    onOpen(cb) {
        if (typeof cb === 'function') this._onOpenHandlers.push(cb)
    }

    triggerCloseHandlers(...args) {
        this._onCloseHandlers.forEach(h => h(...args))
        setTimeout(() => this.connect(), 5000)
    }

    onClose(cb) {
        if (typeof cb === 'function') this._onCloseHandlers.push(cb)
    }

    triggerMessageHandlers(...args) {
        this._onMessageHandlers.forEach(h => h(...args))
    }

    onMessage(cb) {
        if (typeof cb === 'function') this._onMessageHandlers.push(cb)
    }

    send(data) {
        if (!this._ws) return this.triggerErrorHandlers({ message: 'WebSocket not ready!' })

        if (this._ws.readyState) {
            return this._ws.send(data)
        }

        return setTimeout(() => {
            this.send(data)
        }, 10)
    }
}
