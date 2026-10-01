/**
 * @import * from "../_types.mjs";
 */

import { PLACEHOLDER_SENTINELS } from "../constants/constants.mjs";

/**
 * Collapses all placeholder string to `null`. Anything else passes through unchanged.
 * @param {string} value The value to normalize.
 * @returns {string|null} The normalized value.
 */
export function normalizeSentinel( value ) {
  const strippedValue = value?.replaceAll?.( /\s/g, "" );
  if ( PLACEHOLDER_SENTINELS.includes( strippedValue ) ) {
    return null;
  }
  return value;
}

/**
 * Normalizes a SecondStep enum-like token (e.g. `"Thread Item"`, `"PathGrantedTalent"`, `"Effect,raisable"`) into a
 * consistent lower-camelCase token (e.g. `"threadItem"`, `"pathGrantedTalent"`, `"effectRaisable"`). This is purely
 * syntactic normalization; it does not interpret or map the value to any ed4e-specific concept.
 * @param {string} value The raw SecondStep enum token.
 * @returns {string} The normalized token, or the original value if it is not a non-empty string.
 */
export function normalizeEnumToken( value ) {
  if ( typeof value !== "string" || !value.length ) return value;
  const words = value
    .replace( /([a-z0-9])([A-Z])/g, "$1 $2" )
    .split( /[^a-zA-Z0-9]+/ )
    .filter( Boolean );
  if ( !words.length ) return value;
  return words
    .map( ( word, index ) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : lower.charAt( 0 ).toUpperCase() + lower.slice( 1 );
    } )
    .join( "" );
}