/**
 * @import * from "../types.mjs";
 * @import * from "../resolvers/item-resolvers.mjs";
 */

/**
 * @typedef AdaptedTalent
 * @property {ResolvedItem} resolved - The resolved talent item, with `system.level`/`system.talentCategory` applied.
 * @property {string|undefined} sourceSecondStepId - The SecondStep ID this talent is sourced from. To be resolved later
 * by an orchestrator after this item has been created. `undefined` for talents with no resolvable source, currently
 * only `effectRaisable` talents.
 * @property {number|undefined} atLevel - The circle/path-rank at which this talent was learned, for
 * `system.source.atLevel`. `undefined` if not applicable, like for talents granted by namegivers.
 * @property {boolean} isPathTalent - Whether this talent represents a Path itself (SecondStep type `pathTalent`). If
 * `true`, the orchestrator must later also link this talent to the corresponding path item.
 */

/**
 * A matrix granted by a thread item/quipment rather than a talent. Consumed by the equipment adapter.
 * @typedef MatrixGrant
 * @property {string|undefined} equipmentSecondStepId - The SecondStep ID of the equipment item that grants the matrix.
 * @property {string|undefined} spellSecondStepId - The SecondStep ID of the spell attuned to the matrix, if any.
 * @property {number} level - The matrix's level.
 */

import { resolveItem } from "../resolvers/item-resolver.mjs";
import { TALENT_CATEGORY_FROM_SECOND_STEP_TYPE } from "../constants/constants.mjs";

/**
 * Builds a minimal talent item data object to use as the last-resort fallback if the talent cannot be resolved
 * via the lookup tables or edid.
 * @param {ParsedTalent} talent - The parsed talent to synthesize a fallback for.
 * @returns {object} The synthesized talent item data.
 */
function synthesizeTalent( talent ) {
  return {
    name:   talent.id.id,
    type:   "talent",
    img:    "icons/svg/book.svg",
    system: {},
  };
}

/**
 * Extracts the circle at which a talent was learned in its currently assigned source discipline, by matching
 * the talent's parsed `disciplineIds`/`circles` against its single `source`. Returns `undefined` if `source` is
 * not found among the talent's listed disciplines (e.g., the talent is curretnly sourced from a namegiver).
 * @param {ParsedTalent} talent - The parsed talent to extract the circle from.
 * @returns {number|undefined} The matching circle, or `undefined` if no match is found.
 */
function extractDisciplineAtLevel( talent ) {
  if ( !talent.source ) return undefined;
  const index = talent.disciplineIds.findIndex(
    disciplineId => disciplineId.secondStepId === talent.source.secondStepId
  );
  return index === -1 ? undefined : talent.circles[index];
}

/**
 * Determines how a talent is linked to its source (`sourceSecondStepId`/`atLevel`) for a talent, based on its type.
 * @param {ParsedTalent} talent - The parsed talent to determine the link for.
 * @returns {{ sourceSecondStepId: string|undefined, atLevel: number|undefined }} The source link data.
 */
function getSourceLinkage( talent ) {
  switch ( talent.type ) {
    case "pathTalent":
      return { sourceSecondStepId: talent.path?.secondStepId, atLevel: undefined };
    case "pathGrantedTalent":
      return { sourceSecondStepId: talent.path?.secondStepId, atLevel: talent.pathRank };
    case "effectRaisable":
      // EAE-granted talents are not yet implemented in ed4e; no resolvable source item exists.
      return { sourceSecondStepId: undefined, atLevel: undefined };
    default:
      return { sourceSecondStepId: talent.source?.secondStepId, atLevel: extractDisciplineAtLevel( talent ) };

  }
}

/**
 * Resolves every "real" talent from the parsed export into talent item data, excluding `item`-type
 * entries (see {@link MatrixGrant}).
 * Computes `system.level`, `system.talentCategory`, and data the orchestrator needs to later patch `system.source`
 * and path data once all items are embedded in the actor.
 * @param {ParsedTalent[]} talents - The parsed talents from {@link parseSecondStepExport}.
 * @returns {Promise<{ talents: AdaptedTalent[], matrixGrants: MatrixGrant[] }>} The resolved talent items, and
 * any matrix grants to be handled by the equipment adapter instead.
 */
export async function adaptTalents( talents ) {
  const matrixGrants = talents
    .filter( talent => talent.type === "item" )
    .map( talent => ( {
      equipmentSecondStepId: talent.source?.secondStepId,
      spellSecondStepId:     talent.spell?.secondStepId,
      level:                 talent.rank,
    } ) );

  const realTalents = talents.filter( talent => talent.type !== "item" );

  const adaptedTalents = await Promise.all( realTalents.map( async ( talent ) => {
    const resolved = await resolveItem(
      talent.id,
      "talent",
      () => synthesizeTalent( talent ),
    );

    resolved.data.system.level = talent.rank;
    resolved.data.system.talentCategory = TALENT_CATEGORY_FROM_SECOND_STEP_TYPE[ talent.type ] ?? "other";

    return {
      resolved,
      ...getSourceLinkage( talent ),
      isPathTalent: talent.type === "pathTalent",
    };
  } ) );

  return { talents: adaptedTalents, matrixGrants };
}
