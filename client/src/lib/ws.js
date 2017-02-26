import RpcClient from './classes/RpcClient'
import { emitError } from '../ducks/errors/actions'
import { receiveAuthSuccess } from '../ducks/auth/actions'

const ws = new RpcClient('ws://localhost:3000')
export default ws

ws.onMessage(() => {
    //
})

ws.onError(() => {
    // There is no meaningful data passed in with this error callback
    ws.dispatch(emitError({ message: 'WebSocket error!' }))
})

function authenticate() {
    if (ws.getState().auth.isRehydrated) {
        let startingRpc
        const { sessionToken } = ws.getState().auth
        if (sessionToken) {
            startingRpc = ws.rpc('rpc.authenticate', sessionToken)
        } else {
            startingRpc = ws.rpc('login', 'balls', 'balls')
                .then(res => {
                    const { username, token } = res
                    if (username && token) ws.dispatch(receiveAuthSuccess(username, token))
                    return ws.rpc('rpc.authenticate', token)
                })
        }
        startingRpc
        .then(() => ws.rpc('add', 3, 3))
        .then(res => console.log(res))
        .catch(err => console.error(err))
    } else {
        setTimeout(authenticate)
    }
}

ws.onOpen(() => {
    authenticate()
})
