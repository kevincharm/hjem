import axios from 'axios'

import { emitError } from '../errors/actions'
import {
    API_TIMEOUT,
    API_ROUTE_REGISTER,
    API_ROUTE_LOGIN,
    API_ROUTE_LOGOUT
} from '../../config/api'

export const REQUEST_AUTHENTICATION = 'REQUEST_AUTHENTICATION'
export const RECEIVE_AUTHENTICATION = 'RECEIVE_AUTHENTICATION'
export const REQUEST_REGISTRATION = 'REQUEST_REGISTRATION'
export const RECEIVE_REGISTRATION = 'RECEIVE_REGISTRATION'
export const REQUEST_LOGOUT = 'REQUEST_LOGOUT'
export const RECEIVE_LOGOUT = 'RECEIVE_LOGOUT'

function requestLogout(token) {
    return {
        type: REQUEST_LOGOUT,
        payload: {
            token
        }
    }
}

function receiveLogoutSuccess() {
    return {
        type: RECEIVE_LOGOUT
    }
}

export function logout(token) {
    return dispatch => {
        dispatch(requestLogout(token))
        return axios.post(API_ROUTE_LOGOUT, {
            token
        })
        .then(() => (
            dispatch(receiveLogoutSuccess())
        ))
        .catch(err => {
            dispatch(receiveLogoutSuccess())
            dispatch(emitError(err))
        })
    }
}

function requestAuth(username, password) {
    return {
        type: REQUEST_AUTHENTICATION,
        payload: {
            username,
            password
        }
    }
}

function receiveAuthSuccess({ username, token }) {
    return {
        type: RECEIVE_AUTHENTICATION,
        payload: {
            username,
            token
        }
    }
}

export function login(username, password) {
    return dispatch => {
        dispatch(requestAuth(username, password))
        return axios.post(API_ROUTE_LOGIN, {
            username,
            password
        }, { timeout: API_TIMEOUT })
        .then(res => (
            dispatch(receiveAuthSuccess(res.data))
        ))
        .catch(err => (
            dispatch(emitError(err))
        ))
    }
}

function requestRegistration(username, email, password) {
    return {
        type: REQUEST_REGISTRATION,
        payload: {
            username,
            email,
            password
        }
    }
}

function receiveRegistrationSuccess({ username }) {
    return {
        type: RECEIVE_REGISTRATION,
        payload: {
            username
        }
    }
}

export function register(username, email, password) {
    return dispatch => {
        dispatch(requestRegistration(username, email, password))
        return axios.post(API_ROUTE_REGISTER, {
            username,
            email,
            password
        }, { timeout: API_TIMEOUT })
        .then(res => (
            dispatch(receiveRegistrationSuccess(res.data))
        ))
        .catch(err => (
            dispatch(emitError(err))
        ))
    }
}
