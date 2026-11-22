/**
 * @import { ParsedIdSource } from "../_types.mjs";
 */

/**
 * The method by which an item reference is resolved.
 * @typedef { "uuid" | "edid" | "synthesized" } ItemResolutionMethod
 */

/**
 * @typedef ResolvedItem
 * @property {object} data - The resolved item's data, as a plain object suitable for `createEmbeddedDocuments`.
 * @property {ItemResolutionMethod} resolution - How the item was resolved.
 * @property {string} secondStepId - The original SecondStep ID this item was resolved for.
 * @property {string} itemType - The Foundry item type the resolved item actually has.
 */

import { getLookupTable } from "./lookup-tables.mjs";
import { MODULE_ID } from "../constants/constants.mjs";
import { warn } from "../logging/logging.mjs";

/**
 * Resolves a single SecondStep entity reference to Foundry item data, in three tiers:
 * 1. A shipped SecondStep-ID-to-UUID lookup table, resolved with `fromUuid()`.
 * 2. A shipped SecondStep-ID-to-`edid` lookup table, resolved via the global edid search of ed4e.
 * 3. A minimal item synthesized directly from the parsed SecondStep data, flagged for review.
 *
 * With several accepted types, all UUIDs are tried first (in list order), then all ED-IDs, then synthesis.
 * Only a tier whose candidate actually resolves to a document of the type of its table is accepted; a stale
 * or mistyped hit silently falls through to the next tier instead of failing outright.
 * @param {ParsedIdSource} idSource - The parsed SecondStep ID to resolve.
 * @param {string|string[]} itemTypes - The accepted Foundry item types, e.g. `"talent"`. A single string works as
 * a list with one type.
 * @param {() => object} synthesize - Builds a minimal item data object to use as the last-resort fallback.
 * @returns {Promise<ResolvedItem>} The resolved item data and the method that resolved it.
 * @throws {TypeError} If `itemTypes` is an empty list.
 */
export async function resolveItem( idSource, itemTypes, synthesize ) {
  const types = [ itemTypes ].flat();
  if ( types.length === 0 ) throw new TypeError( "resolveItem needs at least one item type." );

  const tables = await Promise.all( types.map( type => getLookupTable( type ) ) );
  const entries = tables.map( table => table[ idSource.secondStepId ] );

  for ( const [ index, type ] of types.entries() ) {
    const entry = entries[ index ];
    if ( !entry?.uuid ) continue;

    const document = await fromUuid( entry.uuid );
    if ( document?.type === type ) {
      return toResolvedItem( document.toObject(), "uuid", idSource, document.type );
    }
    warn(
      `UUID lookup for "${ idSource.secondStepId }" (${ type }) is stale or mistyped, falling back`,
    );
  }

  for ( const [ index, type ] of types.entries() ) {
    const entry = entries[ index ];
    if ( !entry?.edid ) continue;

    const document = await game.ed4e.helpers.document.getSingleGlobalItemByEdid( entry.edid, type );
    if ( document ) {
      return toResolvedItem( document.toObject(), "edid", idSource, document.type );
    }
    warn(
      `ED-ID lookup for "${ idSource.secondStepId }" (${ type }) via "${ entry.edid }" found nothing, synthesizing`,
    );
  }

  const data = synthesize();
  return toResolvedItem( data, "synthesized", idSource, data.type ?? types[ 0 ] );
}

/**
 * Builds the final {@link ResolvedItem}, flagging synthesized items for review.
 * @param {object} data - The resolved item data.
 * @param {ItemResolutionMethod} resolution - How the item was resolved.
 * @param {ParsedIdSource} idSource - The parsed SecondStep ID this item was resolved for.
 * @param {string} itemType - The expected Foundry item type.
 * @returns {ResolvedItem} The finalized resolved item and the method that resolved it.
 */
function toResolvedItem( data, resolution, idSource, itemType ) {
  if ( resolution === "synthesized" ) {
    foundry.utils.mergeObject( data, {
      flags: {
        [ MODULE_ID ]: {
          unresolved:   true,
          secondStepId: idSource.secondStepId,
        },
      },
    } );
  }

  return {
    data,
    resolution,
    secondStepId: idSource.secondStepId,
    itemType,
  };
}
