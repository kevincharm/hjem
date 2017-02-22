export const EMIT_ERROR = 'EMIT_ERROR'
export const CLEAR_ERROR = 'CLOSE_ERROR'

export function emitError(error) {
    return {
        type: EMIT_ERROR,
        error
    }
}

export function clearError(error) {
    return {
        type: CLEAR_ERROR,
        error
    }
}
