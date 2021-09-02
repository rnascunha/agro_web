//https://tools.ietf.org/html/rfc6455#section-11.7
export const Websocket_Close_Reason = {
    1000: 'Normal Closure',
    1001: 'Going Away',
    1002: 'Protocol error',
    1003: 'Unsupported Data',
    /* 1004: Reserved, */
    1005: 'No Status Rcvd',
    1006: 'Abnormal Closure',
    1007: 'Invalid frame payload data',
    1008: 'Policy Violation',
    1009: 'Message Too Big',
    1010: 'Mandatory Ext.',
    1011: 'Internal Server Error',
    1015: 'TLS handshake',
    /* custom reason */
    4001: 'Invalid value',
    4003: 'Missing field',
    4005: 'Internal error',
    4100: 'User not found',
    4101: 'User is inactive',
    4102: 'User is suspended',
    4103: 'User is deleted',
    4104: 'Password not match',
    4105: 'Session expired',
};
Object.freeze(Websocket_Close_Reason);
