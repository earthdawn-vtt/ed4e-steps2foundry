/**
 * Converts the first letter of a string to lowercase.
 * @param { string } theString The string to be modified.
 * @returns { string } The input string with its first letter converted to lowercase.
 */
export function lowerCaseFirstLetter( theString ) {
  if ( typeof theString !== "string" ) throw new TypeError( "Expected a string" );
  if ( theString.length === 0 ) return theString;
  return theString.charAt( 0 ).toLowerCase() + theString.slice( 1 );
}

/**
 * Splits a camelCase or PascalCase string by inserting spaces at word boundaries.
 * Handles transitions between lowercase/digits and uppercase letters, between
 * consecutive uppercase letters and a new uppercase word (e.g., "XMLParser" → "XML Parser"),
 * and between digits and letters (e.g., "test123Value" → "test 123 Value").
 * Supports non-ASCII characters (e.g., accented letters like é, ñ, ü).
 * @param {string} theString The string to be split.
 * @returns {string} The split string.
 */
export function splitCamelCase( theString ) {
  if ( typeof theString !== "string" ) throw new TypeError( "Expected a string" );
  if ( theString.length === 0 ) return theString;

  return theString
    // Lowercase/digit followed by uppercase
    .replace( /([\p{Lowercase_Letter}\p{Decimal_Number}]\p{Mark}*)(\p{Uppercase_Letter})/gu, "$1 $2" )

    // Acronym followed by a capitalized word
    // Also handles uncased letters before a capitalized word
    .replace( /(\p{Letter}\p{Mark}*)(\p{Uppercase_Letter}\p{Mark}*\p{Lowercase_Letter})/gu, "$1 $2" )

    // Digit followed by letter
    .replace( /(\p{Decimal_Number}\p{Mark}*)(\p{Letter})/gu, "$1 $2" )

    // Letter followed by digit
    .replace( /(\p{Letter}\p{Mark}*)(\p{Decimal_Number})/gu, "$1 $2" );
}