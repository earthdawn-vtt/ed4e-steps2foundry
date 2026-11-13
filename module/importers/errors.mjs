/**
 * Custom error class for errors that occur during import adapted SecondStep data.
 */
export class SecondStepImportError extends Error {

  /**
   * @param {string} message - The error message.
   * @param {object} options
   * @param {*} [options.cause] - The underlying error that caused this one.
   */
  constructor( message, { cause } = {} ) {
    super( message, { cause, } );
  }

}