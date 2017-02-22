import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link, browserHistory } from 'react-router'
import { persistStore } from 'redux-persist'

import store from '../store'
import * as appActions from '../ducks/appActions'
import Errors from './Errors'

const redirectToLogin = () => {
    browserHistory.push('/login')
}

const redirectToDefaultRoute = () => {
    const { pathname } = browserHistory.getCurrentLocation() || {}
    if (pathname === '/') {
        browserHistory.push('/devices')
    }
}

browserHistory.listen(event => {
    redirectToDefaultRoute()
})

const NavLink = (props) => (
    <Link to={props.to}>
        <div>
            {props.label}
        </div>
    </Link>
)

class App extends Component {
    static propTypes = {
        actions: PropTypes.object,
        isAuthenticating: PropTypes.bool,
        authError: PropTypes.object,
        username: PropTypes.string
    }

    state = {
        rehydrated: false
    }

    componentWillMount() {
        redirectToDefaultRoute()
        persistStore(store, {
            whitelist: [
                'auth'
            ]
        }, (err, restoredState) => {
            this.setState({ rehydrated: true })
        })
    }

    logout() {
        const {
            actions: {
                logout
            },
            auth: {
                sessionToken
            }
        } = this.props
        return logout(sessionToken).then(() => {
            redirectToLogin()
        }).catch(() => {
            redirectToLogin()
        })
    }

    render() {
        // TODO: add proper loading screen
        if (!this.state.rehydrated) return (<div>Loading...</div>)

        const {
            auth: {
                username
            }
        } = this.props

        return (
            <div className="viewport">
                <div className="main-content">
                    {this.props.children}
                </div>
                <Errors />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return state
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(appActions, dispatch)
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App)
