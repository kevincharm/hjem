/**
 *  RpcServer
 *  Creates an RPC server from a WebSocket connection.
 *  Loosely follows JSON-RPC 2.0 (but not really)
 */

const EventEmitter = require('events')
const uuid = require('uuid')

const RPC_TIMEOUT = 10000
const RPC_GC_INTERVAL = 10000

const JSON_RPC_HEADER = {
    jsonrpc: '2.0-hellstad' /* coz not really jsonrpc lolz */
}

class RpcServer extends EventEmitter {
    constructor(wss) {
        super()

        this._wss = wss
        this._methods = {}
        this._connections = []
        this._activeRpcTable = []

        this._wss.on('connection', ws => {
            ws._id = uuid.v4()
            this._connections.push(ws)

            ws.on('message', msg => {
                try {
                    const request = JSON.parse(msg)
                    if (typeof request === 'object') {
                        // Single request
                        this._handleMessage(ws, request)
                    } else if (Array.isArray(request)) {
                        // Support batching
                        request.forEach(r => {
                            if (typeof r === 'object') this._handleMessage(ws, r)
                        })
                    }
                } catch (e) {
                    this.emit('error', new Error(`Invalid message: ${msg}`))
                }
            })

            ws.on('close', () => {
                this._handleClose(ws)
            })
        })

        this._startRpcGc()
    }

    _handleClose(ws) {
        this._connections = this._connections.filter(c => c._id !== ws._id)
        this._activeRpcTable = this._activeRpcTable.filter(r => r.wsId !== ws._id)
    }

    _startRpcGc() {
        const now = new Date().getTime()
        this._activeRpcTable = this._activeRpcTable.filter(rpc => {
            const expired = (now - rpc.createdAt) >= RPC_TIMEOUT
            if (expired) this._handleRpcTimeout(rpc.rpcId)

            return !expired
        })

        setTimeout(() => this._startRpcGc(), RPC_GC_INTERVAL)
    }

    _cancelRpc(rpc) {
        this._activeRpcTable = this._activeRpcTable.filter(r => r.id !== rpc.id)
    }

    _handleRpcTimeout(rpcId) {
        const rpc = this._activeRpcTable.find(r => r.rpcId === rpcId)
        if (!rpc) {
            this.emit('error', new Error(`Cannot timeout unknown RPC id ${rpcId}`))
            return
        }

        const ws = this._connections.find(c => c._id === rpc.wsId)
        if (!ws) {
            this.emit('error', new Error(`Cannot timeout unknown connection ${rpc.wsId}`))
            return
        }

        const responseObject = Object.assign({}, JSON_RPC_HEADER, {
            id: rpcId,
            error: {
                code: 500,
                message: 'RPC timeout'
            }
        })

        try {
            ws.send(JSON.stringify(responseObject))
        } catch (e) {
            this.emit('error', new Error(`Error while trying to send RPC response ${e}`))
        }
    }

    _handleRpcResolve(rpcId, wsId) {
        return (result = null) => {
            const rpc = this._activeRpcTable.find(r => {
                return r.rpcId === rpcId && r.wsId === wsId
            })
            if (!rpc) {
                this.emit('error', new Error(`Cannot route to unknown RPC id ${rpcId}`))
                return
            }

            const ws = this._connections.find(c => c._id === rpc.wsId)
            if (!ws) {
                this.emit('error', new Error(`Cannot route to unknown connection ${rpc.wsId}`))
                return
            }

            const responseObject = Object.assign({}, JSON_RPC_HEADER, {
                id: rpcId,
                result
            })

            try {
                ws.send(JSON.stringify(responseObject))
            } catch (e) {
                this.emit('error', new Error(`Error while trying to send RPC response ${e}`))
            }

            this._cancelRpc(rpc)
        }
    }

    _handleRpcReject(rpcId, wsId) {
        return (error = {}) => {
            const rpc = this._activeRpcTable.find(r => {
                return r.rpcId === rpcId && r.wsId === wsId
            })
            if (!rpc) {
                this.emit('error', new Error(`Cannot route to unknown RPC id ${rpcId}`))
                return
            }

            const ws = this._connections.find(c => c._id === rpc.wsId)
            if (!ws) {
                this.emit('error', new Error(`Cannot route to unknown connection ${rpc.wsId}`))
                return
            }

            const responseObject = Object.assign({}, JSON_RPC_HEADER, {
                id: rpcId,
                error: {
                    code: error.code || 500,
                    message: error.message || 'Internal server error'
                }
            })

            try {
                ws.send(JSON.stringify(responseObject))
            } catch (e) {
                this.emit('error', new Error(`Error while trying to send RPC response ${e}`))
            }

            this._cancelRpc(rpc)
        }
    }

    _handleMessage(ws, request) {
        const { id, method, params, jsonrpc } = request

        // Validate header
        if (!jsonrpc || jsonrpc !== JSON_RPC_HEADER.jsonrpc) {
            this.emit('error', new Error('Skipping non-jsonrpc message'))
            return
        }

        // Check that an id is present
        const idIsValid = typeof id === 'string' || typeof id === 'number'
        if (!((id || id === 0) && idIsValid)) {
            this.emit('error', new Error(`Invalid RPC id ${id}`))
            try {
                const responseIdErr = Object.assign({}, JSON_RPC_HEADER, {
                    id: null,
                    error: {
                        code: -32001,
                        message: 'Implementation requires valid id'
                    }
                })
                ws.send(JSON.stringify(responseIdErr))
            } catch (e) {}
            return
        }

        // Validate method name
        if (!method || typeof method !== 'string') {
            this.emit('error', new Error('Invalid method name.'))
            try {
                const responseMethodNameErr = Object.assign({}, JSON_RPC_HEADER, {
                    id,
                    error: {
                        code: -32600,
                        message: 'Invalid request'
                    }
                })
                ws.send(JSON.stringify(responseMethodNameErr))
            } catch (e) {}
            return
        }

        // Check that method is registered
        const methodToInvoke = this._methods[method]
        if (typeof methodToInvoke !== 'function') {
            this.emit('error', new Error(`Cannot invoke unknown method '${method}'`))
            try {
                const responseMethodErr = Object.assign({}, JSON_RPC_HEADER, {
                    id,
                    error: {
                        code: -32601,
                        message: 'Method not found'
                    }
                })
                ws.send(JSON.stringify(responseMethodErr))
            } catch (e) {}
            return
        }

        // Route the call
        this._activeRpcTable.push({
            rpcId: id,
            wsId: ws._id,
            createdAt: new Date().getTime()
        })

        let methodWithParams
        if (Array.isArray(params)) {
            methodWithParams = methodToInvoke(...params)
        } else {
            methodWithParams = methodToInvoke()
        }

        if (typeof methodWithParams !== 'function') {
            this.emit('error', new Error(`Registered method '${method}' must return a function`))
            return
        }

        methodWithParams(this._handleRpcResolve(id, ws._id), this._handleRpcReject(id, ws._id))
    }

    /**
     *  -*- PUBLIC METHODS -*-
     */

    registerMethods(methods = {}) {
        const validatedMethods = Object.assign({}, methods)
        Object.keys(validatedMethods).forEach(m => {
            if (typeof m !== 'string' ||
                m.match(/^rpc\./i) ||
                typeof validatedMethods[m] !== 'function') {
                this.emit('error', new Error(`Invalid method '${m}'`))
                delete validatedMethods[m]
            }
        })

        this._methods = Object.assign(this._methods, validatedMethods)
    }
}

module.exports = {
    RpcServer
}
