import { SecondStepImportError } from "./errors.mjs";
import { SecondStepFormatError } from "../parsers/errors.mjs";

/**
 * The message for the user for anything that can go wrong while importing a file.
 * @param {unknown} error - Whatever was thrown.
 * @returns {string} The localized message.
 */
export function getImportErrorMessage( error ) {
  if ( error instanceof SecondStepFormatError ) return _loc( "S2F.Error.invalidFile" );
  if ( error instanceof SecondStepImportError ) return error.message;
  return _loc( "S2F.Error.unexpected" );
}

/**
 * Describes an error for the import log.
 * @param {unknown} error - Whatever was thrown.
 * @returns {import("../_types.mjs").ImportErrorDescription} The message for the user, and what caused the error.
 */
export function describeImportError( error ) {
  const message = getImportErrorMessage( error );
  const isKnown = error instanceof SecondStepFormatError || error instanceof SecondStepImportError;

  const cause = error instanceof Error ? error.cause : undefined;
  if ( cause !== undefined && cause !== null ) {
    return { message, cause: cause instanceof Error ? cause.message : String( cause ) };
  }

  if ( !isKnown && error instanceof Error ) return { message, cause: error.message };

  return { message, cause: null };
}
