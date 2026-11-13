/**
 * @import { AdaptedCharacter, ImportReport } from "../_types.mjs";
 */

import { MODULE_ID } from "../constants/constants.mjs";

/**
 * Builds a report summarizing an adapted character: how items were resolved, which need review, and which parts
 * of the export were not imported.
 *
 * Unresolved items are detected by the `unresolved` flag, not by `resolution === "synthesized"`, so deliberately
 * built items like coins are not listed.
 * @param {AdaptedCharacter} adaptedCharacter - The adapted character.
 * @returns {ImportReport} The import report.
 */
export function buildImportReport( adaptedCharacter ) {
  const { actorData, entries, deferred } = adaptedCharacter;

  const resolutions = { uuid: 0, edid: 0, synthesized: 0 };
  const unresolved = [];

  for ( const { kind, resolved } of entries ) {
    resolutions[ resolved.resolution ]++;

    if ( resolved.data.flags?.[ MODULE_ID ]?.unresolved === true ) {
      unresolved.push( {
        kind,
        name:         resolved.data.name,
        itemType:     resolved.itemType,
        secondStepId: resolved.secondStepId,
      } );
    }
  }

  return {
    characterName: actorData.name,
    itemCount:     entries.length,
    resolutions,
    unresolved,
    deferred:      Object.entries( deferred )
      .filter( ( [ , count ] ) => count > 0 )
      .map( ( [ section, count ] ) => ( { section, count } ) ),
  };
}
