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
  if ( PLACEHOLDER_SENTINELS.has( strippedValue ) ) {
    return null;
  }
  return value;
}
