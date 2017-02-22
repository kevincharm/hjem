import urljoin from 'url-join'

export const API_ROUTE_BASE = process.env.API_ROUTE_BASE
export const API_ROUTE_VERSION = 'v2'
export const API_ROUTE_REGISTER = urljoin(API_ROUTE_BASE, 'register')
export const API_ROUTE_LOGIN = urljoin(API_ROUTE_BASE, 'login')
export const API_ROUTE_LOGOUT = urljoin(API_ROUTE_BASE, 'logout')
export const API_TIMEOUT = 10000
