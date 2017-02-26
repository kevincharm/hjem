import RpcClient from './classes/RpcClient'
import { emitError } from '../ducks/errors/actions'

const ws = new RpcClient('ws://localhost:3000')
export default ws

ws.onMessage(() => {
    //
})

ws.onError(() => {
    // There is no meaningful data passed in with this error callback
    ws.dispatch(emitError({ message: 'WebSocket error!' }))
})

ws.onOpen(() => {
    ws.rpc('add', 3, 3)
    .then(res => console.log(res))
    .catch(err => console.error(err))
})
