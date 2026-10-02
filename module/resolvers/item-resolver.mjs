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
 * @property {string} itemType - The expected Foundry item type.
 */

import { getLookupTable } from "./lookup-tables.mjs";
import { MODULE_ID } from "../constants/constants.mjs";

/**
 * Resolves a single SecondStep entity reference to Foundry item data, in three tiers:
 * 1. A shipped SecondStep-ID-to-UUID lookup table, resolved with `fromUuid()`.
 * 2. A shipped SecondStep-ID-to-`edid` lookup table, resolved via ed4e`s global edid search.
 * 3. A minimal item synthesized directly from the parsed SecondStep data, flagged for review.
 *
 * Only a tier whose candidate actually resolves to a document of the expected `itemType` is accepted; a stale
 * or mistyped hit silently falls through to the next tier instead of failing outright.
 * @param {ParsedIdSource} idSource - The parsed SecondStep ID to resolve.
 * @param {string} itemType - The expected Foundry item type, e.g. `"talent"`.
 * @param {() => object} synthesize - Builds a minimal item data object to use as the last-resort fallback.
 * @returns {Promise<ResolvedItem>} The resolved item data and the method that resolved it.
 */
export async function resolveItem( idSource, itemType, synthesize ) {
  const table = await getLookupTable( itemType );
  const entry = table[ idSource.secondStepId ];

  if ( entry?.uuid ) {
    const document = await fromUuid( entry.uuid );
    if ( document?.type === itemType ) {
      return toResolvedItem( document.toObject(), "uuid", idSource, itemType );
    }
    console.warn(
      `${ MODULE_ID } | UUID lookup for "${ idSource.secondStepId }" (${ itemType }) is stale or mistyped, falling back`,
    );
  }

  if ( entry?.edid ) {
    const document = await game.ed4e.helpers.document.getSingleGlobalItemByEdid( entry.edid, itemType );
    if ( document ) {
      return toResolvedItem( document.toObject(), "edid", idSource, itemType );
    }
    console.warn(
      `${ MODULE_ID } | ED-ID lookup for "${ idSource.secondStepId }" (${ itemType }) via "${ entry.edid }" found nothing, synthesizing`,
    );
  }

  return toResolvedItem( synthesize(), "synthesized", idSource, itemType );
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
