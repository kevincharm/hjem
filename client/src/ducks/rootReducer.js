import { combineReducers } from 'redux'

import errorsReducer from './errors'
import authReducer from './auth'

export default combineReducers({
    errors: errorsReducer,
    auth: authReducer,
})
