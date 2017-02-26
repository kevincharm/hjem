const test = require('tape')
const EventEmitter = require('events')
const { RpcServer } = require('../classes/RpcServer')

class MockWsConnection extends EventEmitter {
    sendToServer(msg) {
        this.emit('message', msg)
    }

    send(msg) {
        this.emit('messageFromServer', msg)
    }
}

class MockWsServer extends EventEmitter {
    send(msg) {
        this.emit('send', msg)
    }

    connectFromClient(ws) {
        this.emit('connection', ws)
    }
}

test.onFinish(() => {
    process.exit()
})

test('Reject invalid jsonrpc header', { timeout: 1000 }, t => {
    const wss = new MockWsServer()
    const client = new MockWsConnection()
    const rpcServer = new RpcServer(wss)

    rpcServer.on('error', err => {
        t.ok(err, `Received error: ${err}`)
    })

    wss.once('connection', ws => {
        const incorrectHeaders = [
            {
                jsonrpc: 'afdlkjadgk'
            },
            {
                jsonrpc: '1.0'
            },
            {
                jsonrpc: 'two.point.zero'
            }
        ]

        t.plan(incorrectHeaders.length)

        incorrectHeaders.forEach(h => {
            ws.sendToServer(JSON.stringify(h))
        })
    })

    wss.connectFromClient(client)
})

test('Reject invalid RPC id', { timeout: 1000 }, t => {
    const wss = new MockWsServer()
    const client = new MockWsConnection()
    const rpcServer = new RpcServer(wss)

    client.on('messageFromServer', msg => {
        const response = JSON.parse(msg)
        if (response.error) {
            const { code, message } = response.error
            t.equal(code, -32001, `Rejected by server: ${message}`)
        } else {
            t.fail('Did not get an error object')
        }
    })

    rpcServer.on('error', err => {
        //
    })

    wss.once('connection', ws => {
        const incorrectHeaders = [
            {
                jsonrpc: '2.0-hellstad',
                id: true
            },
            {
                jsonrpc: '2.0-hellstad',
                id: {}
            }
        ]

        t.plan(incorrectHeaders.length)

        incorrectHeaders.forEach(h => {
            ws.sendToServer(JSON.stringify(h))
        })
    })

    wss.connectFromClient(client)
})

test('Reject invalid method name', { timeout: 1000 }, t => {
    const wss = new MockWsServer()
    const client = new MockWsConnection()
    const rpcServer = new RpcServer(wss)

    client.on('messageFromServer', msg => {
        const response = JSON.parse(msg)
        if (response.error) {
            const { code, message } = response.error
            t.equal(code, -32600, `Rejected by server: ${message}`)
        } else {
            t.fail('Did not get an error object')
        }
    })

    rpcServer.on('error', err => {
        //
    })

    wss.once('connection', ws => {
        const incorrectHeaders = [
            {
                jsonrpc: '2.0-hellstad',
                id: 0,
                method: true
            },
            {
                jsonrpc: '2.0-hellstad',
                id: 1,
                method: {}
            },
            {
                jsonrpc: '2.0-hellstad',
                id: 2,
                method: 907485
            }
        ]

        t.plan(incorrectHeaders.length)

        incorrectHeaders.forEach(h => {
            ws.sendToServer(JSON.stringify(h))
        })
    })

    wss.connectFromClient(client)
})

test('Reject unknown methods', { timeout: 1000 }, t => {
    const wss = new MockWsServer()
    const client = new MockWsConnection()
    const rpcServer = new RpcServer(wss)

    rpcServer.registerMethods({
        foo() {
            return (resolve, reject) => {
                resolve('bar')
            }
        }
    })

    client.on('messageFromServer', msg => {
        const response = JSON.parse(msg)
        if (response.error) {
            const { code, message } = response.error
            t.equal(code, -32601, `Rejected by server: ${message}`)
        } else {
            t.fail('Did not get an error object')
        }
    })

    rpcServer.on('error', err => {
        //
    })

    wss.once('connection', ws => {
        const incorrectHeaders = [
            {
                jsonrpc: '2.0-hellstad',
                id: 0,
                method: 'hello'
            }
        ]

        t.plan(incorrectHeaders.length)

        incorrectHeaders.forEach(h => {
            ws.sendToServer(JSON.stringify(h))
        })
    })

    wss.connectFromClient(client)
})

test('Accept existing methods with params and resolve correctly', { timeout: 1000 }, t => {
    const wss = new MockWsServer()
    const client = new MockWsConnection()
    const rpcServer = new RpcServer(wss)

    rpcServer.registerMethods({
        add(...args) {
            return (resolve, reject) => {
                resolve(args.reduce((p, c) => p + c, 0))
            }
        }
    })

    client.on('messageFromServer', msg => {
        const response = JSON.parse(msg)
        if (response.result) {
            t.equal(response.result, 5, 'RPC add(2, 2, 1) resolves with 5')
        } else {
            t.fail('Did not get a result object')
        }
    })

    rpcServer.on('error', err => {
        //
    })

    wss.once('connection', ws => {
        const incorrectHeaders = [
            {
                jsonrpc: '2.0-hellstad',
                id: 0,
                method: 'add',
                params: [2, 2, 1]
            }
        ]

        t.plan(incorrectHeaders.length)

        incorrectHeaders.forEach(h => {
            ws.sendToServer(JSON.stringify(h))
        })
    })

    wss.connectFromClient(client)
})
