const WebSocketServer = require('uws').Server
const wss = new WebSocketServer({ port: 3000 })
const { RpcServer } = require('./RpcServer')

const rpcServer = new RpcServer(wss)

rpcServer.on('error', err => {
    console.error(err)
})

rpcServer.registerMethods({
    echo(message) {
        return (resolve, reject) => {
            resolve(`${message}`)
        }
    },
    add(...args) {
        return (resolve, reject) => {
            resolve(args.reduce((p, c) => p + c, 0))
        }
    }
})
