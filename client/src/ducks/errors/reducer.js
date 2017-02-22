// reducer
import {
    EMIT_ERROR,
    CLEAR_ERROR
} from './actions'

const defaultErrorState = {
    isVisible: false,
    error: {}
}

export default function errorsReducer(state = defaultErrorState, action) {
    switch (action.type) {
        case EMIT_ERROR:
            return Object.assign({}, state, {
                isVisible: true,
                error: action.error || {}
            })
        case CLEAR_ERROR:
            return Object.assign({}, state, {
                isVisible: false
            })
        default:
            return state
    }
}
