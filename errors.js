var TypedError = require('error/typed');

var LoggerRequired = TypedError({
    type: 'uncaught-exception.logger.required',
    message: 'uncaught-exception: the options.logger ' +
        'parameter is required.\n' +
        'Please call `uncaught({ logger: logger })`.\n'
});

var LoggerMethodRequired = TypedError({
    type: 'uncaught-exception.logger.methodsRequired',
    message: 'uncaught-exception: the options.logger should ' +
        'have either a fatal() method.\n' +
        'Please call `uncaught({ logger: logger }) with a ' +
        'logger that has a fatal method.\n'
});

var LoggerTimeoutError = TypedError({
    type: 'uncaught-exception.logger.timeout',
    message: 'uncaught-exception: the logger.fatal() method ' +
        'timed out.\n' +
        'Expected it to finish within {time} ms.\n'
});

var ShutdownTimeoutError = TypedError({
    type: 'uncaught-exception.shutdown.timeout',
    message: 'uncaught-exception: the gracefulShutdown() ' +
        'function timed out.\n' +
        'Expected it to finish within {time} ms.\n'
});

var LoggerThrownException = TypedError({
    type: 'uncaught-exception.logger.threw',
    message: 'uncaught-exception: the logger.fatal() method ' +
        'threw an exception.\n' +
        'Expected it to not throw at all.\n' +
        'message: {errorMessage}.\n' +
        'type: {errorType}.\n' +
        'stack: {errorStack}.\n'
});

var ShutdownThrownException = TypedError({
    type: 'uncaught-exception.shutdown.threw',
    message: 'uncaught-exception: the gracefulShutdown() ' +
        'function threw an exception.\n' +
        'Expected it to not throw at all.\n' +
        'message: {errorMessage}.\n' +
        'type: {errorType}.\n' +
        'stack: {errorStack}.\n'
});

var LoggerAsyncError = TypedError({
    type: 'uncaught-exception.logger.async-error',
    message: 'uncaught-exception: An unexpected exception ' +
        'happened whilst calling `logger.fatal()`.\n' +
        'Expected no exception to happen.\n' +
        'message: {errorMessage}.\n' +
        'type: {errorType}.\n' +
        'stack: {errorStack}.\n' +
        'currentState: {currentState}.\n'
});

var ShutdownAsyncError = TypedError({
    type: 'uncaught-exception.shutdown.async-error',
    message: 'uncaught-exception: An unexpected exception ' +
        'happened whilst calling `gracefulShutdown()`.\n' +
        'Expected no exception to happen.\n' +
        'message: {errorMessage}.\n' +
        'type: {errorType}.\n' +
        'stack: {errorStack}.\n' +
        'currentState: {currentState}.\n'
});

module.exports = {
    LoggerRequired: LoggerRequired,
    LoggerMethodRequired: LoggerMethodRequired,
    LoggerTimeoutError: LoggerTimeoutError,
    ShutdownTimeoutError: ShutdownTimeoutError,
    LoggerThrownException: LoggerThrownException,
    ShutdownThrownException: ShutdownThrownException,
    LoggerAsyncError: LoggerAsyncError,
    ShutdownAsyncError: ShutdownAsyncError
};
