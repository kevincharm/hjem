import React, { Component, PropTypes } from 'react'
import { Router, Route, Link, browserHistory } from 'react-router'

import App from './App'
import NoMatch from './NoMatch'
import Home from './Home'

export default class AppRouter extends Component {
    render() {
        return (
            <Router history={ browserHistory }>
                <Route path="/" component={ App }>
                    <Route path="home" component={ Home } />
                    <Route path="*" component={ NoMatch } />
                </Route>
            </Router>
        )
    }
}
