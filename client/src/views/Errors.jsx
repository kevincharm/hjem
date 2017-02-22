import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as errorActions from '../ducks/errors'

class Errors extends Component {
    static propTypes = {
        actions: PropTypes.object,
        errors: PropTypes.object
    }

    render() {
        const {
            actions: {
                clearError
            },
            errors: {
                isVisible,
                error
            }
        } = this.props

        return (
            <div>
                { isVisible && <div>Error: {error.message}</div> }
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        actions: state.actions,
        errors: state.errors
    }
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(errorActions, dispatch)
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Errors)
