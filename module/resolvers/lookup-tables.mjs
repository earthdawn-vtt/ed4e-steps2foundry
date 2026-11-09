/**
 * @typedef LookupTableEntry
 * @property {string} [uuid] - A Foundry document UUID expected to resolve to the matching item.
 * @property {string} [edid] - An ed4e `edid` to fall back to if the UUID is missing or stale.
 */

/**
 * @typedef {Record<string, LookupTableEntry>} LookupTable
 * A lookup table mapping a SecondStep ID (the full, unsplit `secondStepId`) to a {@link LookupTableEntry}.
 */

import { MODULE_ID } from "../constants/constants.mjs";
import { warn } from "../logging/logging.mjs";

/**
 * In-memory cache of loaded lookup tables, keyed by Foundry item type.
 * @type {Map<string, LookupTable>}
 */
const lookupTableCache = new Map();

/**
 * Loads (and caches) the lookup table for the given item type from `lookup-tables/<itemType>.json`.
 * @param {string} itemType - The Foundry item type the table belongs to, e.g. `"talent"`.
 * @returns {Promise<LookupTable>} The loaded lookup table, or an empty object if none exists for this type.
 */
export async function getLookupTable( itemType ) {
  if ( lookupTableCache.has( itemType ) ) return lookupTableCache.get( itemType );

  let table = {};
  try {
    const response = await fetch( `modules/${ MODULE_ID }/lookup-tables/${ itemType }.json` );
    if ( response.ok ) table = await response.json();
  } catch ( error ) {
    warn( `Could not load lookup table for item type ${ itemType }`, error );
  }

  lookupTableCache.set( itemType, table );
  return table;
}

/**
 * Clears the in-memory lookup table cache. Mainly useful for testing.
 */
export function clearLookupTableCache() {
  lookupTableCache.clear();
}