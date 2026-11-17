import { SecondStepFormatError } from "../parsers/errors.mjs";

/**
 * Reads a file and parses it as JSON. Whether the JSON is a valid Second Step export is not checked here,
 * that is the job of the parser.
 * @param {File} file - The file the user selected.
 * @returns {Promise<object>} The parsed JSON object.
 * @throws {SecondStepFormatError} If the file is not valid JSON, or if its JSON is not an object.
 */
export async function readSecondStepFile( file ) {
  const text = await file.text();

  let parsed;
  try {
    parsed = JSON.parse( text );
  } catch ( cause ) {
    if ( cause instanceof SyntaxError ) {
      throw new SecondStepFormatError( `The file "${ file.name }" is not valid JSON.`, { cause } );
    }
    throw cause;
  }

  if ( parsed === null || typeof parsed !== "object" || Array.isArray( parsed ) ) {
    throw new SecondStepFormatError( `The file "${ file.name }" does not contain a JSON object.` );
  }

  return parsed;
}
