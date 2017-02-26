import {
    REQUEST_AUTHENTICATION,
    RECEIVE_AUTHENTICATION,
    RECEIVE_LOGOUT
} from './actions'

const defaultAuthState = {
    isRehydrated: false,
    isAuthenticating: false,
    username: null,
    sessionToken: null
}

export default function authReducer(state = defaultAuthState, action) {
    const payload = action.payload || {}
    const {
        username,
        token
    } = payload

    switch (action.type) {
        case 'persist/REHYDRATE':
            return Object.assign({}, state, {
                isRehydrated: true
            })
        case REQUEST_AUTHENTICATION:
            return Object.assign({}, state, {
                isAuthenticating: true,
                sessionToken: null
            })
        case RECEIVE_AUTHENTICATION:
            return Object.assign({}, state, {
                isAuthenticating: false,
                sessionToken: token,
                username
            })
        case RECEIVE_LOGOUT:
            return Object.assign({}, state, {
                username: null,
                sessionToken: null
            })
        default:
            return state
    }
}
