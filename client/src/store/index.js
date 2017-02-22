import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { autoRehydrate } from 'redux-persist'

import rootReducer from '../ducks/rootReducer'
import ws from '../lib/ws'

const reduxMiddlewares = [
    applyMiddleware(thunk.withExtraArgument({ ws })),
    autoRehydrate()
]

/* eslint-disable no-undef, no-underscore-dangle */
if (process.env.NODE_ENV !== 'production' && window.navigator.userAgent.match(/chrome/i)) {
    reduxMiddlewares.push(window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
}
/* eslint-enable no-undef */

const store = createStore(
    rootReducer,
    {},
    compose(...reduxMiddlewares)
)

ws.setStore(store)

export default store
