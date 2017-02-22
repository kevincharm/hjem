import WebSocketConnection from './classes/WebSocketConnection'
import { emitError } from '../ducks/errors/actions'

const ws = new WebSocketConnection('wss://callback.hell')
export default ws

ws.onMessage(event => {
    const msg = JSON.parse(event.data)
})

ws.onError(() => {
    // There is no meaningful data passed in with this error callback
    ws.dispatch(emitError({ message: 'WebSocket error!' }))
})
