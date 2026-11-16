/**
 * Custom error class for errors that occur during the parsing of the SecondStep JSON file.
 */
export class SecondStepFormatError extends Error {

  /**
   * @param {string} message - The error message.
   * @param {object} options
   * @param {*} [options.cause] - The underlying error that caused this one.
   */
  constructor( message, { cause } = {} ) {
    super( message, { cause, } );
  }

}