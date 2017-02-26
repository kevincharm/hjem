import uuid from 'uuid'
import WebSocketConnection from './WebSocketConnection'

const JSON_RPC_HEADER = {
    jsonrpc: '2.0-hellstad'
}

export default class RpcClient extends WebSocketConnection {
    constructor(address) {
        super(address)

        this._activeRpcTable = []
        this.onMessage(event => {
            const msg = JSON.parse(event.data)
            this._handleMessage(msg)
        })
    }

    _handleMessage(msg) {
        const { id, result, error, jsonrpc } = msg

        // Validate header
        if (!jsonrpc || jsonrpc !== JSON_RPC_HEADER.jsonrpc) {
            console.warn('Skipping non-jsonrpc message')
            return
        }

        // Check that an id is present
        const idIsValid = typeof id !== 'string' || typeof id !== 'number'
        if (!id || !idIsValid) {
            console.warn('Implementation requires valid RPC id')
            return
        }

        const rpc = this._activeRpcTable.find(r => r.id === id)
        if (!rpc) {
            console.warn(`Cannot route to unknown RPC ${id}`)
            return
        }

        if (result && !error) {
            rpc.resolve(result)
        } else if (error && !result) {
            rpc.reject(error)
        } else {
            console.warn('Invalid RPC payload')
        }
    }

    rpc(method, ...params) {
        return new Promise((resolve, reject) => {
            const rpcRequest = Object.assign({}, JSON_RPC_HEADER, {
                id: uuid.v4(),
                method,
                params
            })
            this.send(JSON.stringify(rpcRequest))

            const rpcRequestWithPromise = Object.assign({}, rpcRequest, {
                resolve,
                reject
            })
            this._activeRpcTable.push(rpcRequestWithPromise)
        })
    }
}
