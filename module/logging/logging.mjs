import { MODULE_ID } from "../constants/constants.mjs";

/**
 * Format a log message with prefix, timestamp, and level.
 * @param {string} message  The message to format.
 * @param {string} level    The log level (e.g. "INFO", "ERROR").
 * @returns {string}        The formatted message.
 */
function _formatMessage( message, level )
{
  const now = new Date().toISOString().slice( 0, 19 );
  return `[${ MODULE_ID }] | ${ now } ${ level.toUpperCase() }:\n${ message }`;
}

/**
 * Internal logging method.
 * @param {string} level    The log level.
 * @param {string} message  The message to log.
 * @param {...*} args       Additional arguments to the used {@link console} method.
 * @protected
 */
function _log( level, message, ...args )
{
  let consoleMethod = console.log;

  if ( level.toUpperCase() === "ERROR" )
    consoleMethod = console.error;
  else if ( level.toUpperCase() === "WARN" )
    consoleMethod = console.warn;
  else if ( level.toUpperCase() === "LOG" )
    consoleMethod = console.log;
  else if ( level.toUpperCase() === "DEBUG" )
    consoleMethod = console.debug;
  else if ( level.toUpperCase() === "INFO" )
    consoleMethod = console.info;

  const fullMsg = _formatMessage( message, level );
  consoleMethod( fullMsg, ...args );
}

/**
 * Log a debug message.
 * @param {string} message  The message to log.
 * @param {...*} args       Additional arguments to the used {@link console} method.
 */
export function debug( message, ...args )
{
  _log( "debug", message, ...args );
}

/**
 * Log an info message.
 * @param {string} message  The message to log.
 * @param {...*} args       Additional arguments to the used {@link console} method.
 */
export function info( message, ...args )
{
  _log( "info", message, ...args );
}

/**
 * Log a general log message.
 * @param {string} message  The message to log.
 * @param {...*} args       Additional arguments to the used {@link console} method.
 */
export function log( message, ...args )
{
  _log( "log", message, ...args );
}

/**
 * Log a warning message.
 * @param {string} message  The message to log.
 * @param {...*} args       Additional arguments to the used {@link console} method.
 */
export function warn( message, ...args )
{
  _log( "warn", message, ...args );
}

/**
 * Log an error message.
 * @param {string} message  The message to log.
 * @param {...*} args       Additional arguments to the used {@link console} method.
 */
export function error( message, ...args )
{
  _log( "error", message, ...args );
}