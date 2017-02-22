import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import React from 'react'

import AppRouter from 'views/AppRouter'
import store from 'store'

import './styles/index.scss'
import './index.html'

ReactDOM.render(
    <Provider store={store}>
        <AppRouter />
    </Provider>,
    document.getElementById('root')
)
