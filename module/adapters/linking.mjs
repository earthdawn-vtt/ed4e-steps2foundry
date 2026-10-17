/**
 * @import { AdaptedTalent } from "./talent.mjs";
 */

/**
 * @typedef SourceableEmbeddedItem
 * @property {string} id - The real Foundry ID of the embedded item (a class) on the actor.
 * @property {string} secondStepId - The SecondStep ID this item was resolved from.
 */

/**
 * @typedef EmbeddedTalent
 * @property {string} id - The real Foundry ID of the embedded item on the actor.
 * @property {AdaptedTalent} adapted - The adapted talent data this embedded item was created from.
 */

/**
 * @typedef TalentSourceUpdate
 * @property {string} itemId - The real Foundry ID of the embedded talent item to patch.
 * @property {object} updateData - The update payload, setting `system.source.class`/`system.source.atLevel`.
 */

/**
 * @typedef ClassAbilityLinkUpdate
 * @property {string} itemId - The real Foundry ID of the embedded class item (path, questor) to patch.
 * @property {object} updateData - The update payload, setting `system.pathTalentId`/`system.questorDevotionId`.
 */

import { MODULE_ID } from "../constants/constants.mjs";

/**
 * Links every embedded talent that has a resolvable `sourceSecondStepId` to the real Foundry ID of its embedded
 * source item (a discipline or path), and, for path talents, links the path item back to the talent via
 * `system.pathTalentId`.
 *
 * Talents with `sourceSecondStepId === undefined` (like from namegivers or effects) are left untouched, since there is
 * no `source` for them right now.
 * @param {EmbeddedTalent[]} embeddedTalents - The talents already embedded in the actor, paired with the adapted data
 * they were created from.
 * @param {SourceableEmbeddedItem[]} sourceableItems - The classes already embedded in the actor that talents may be
 * sourced from.
 * @returns {{ talentUpdates: TalentSourceUpdate[], pathUpdates: ClassAbilityLinkUpdate[] }} The update payloads to apply
 * via `updateEmbeddedDocuments`, separated by the item type they target.
 */
export function linkTalentSources( embeddedTalents, sourceableItems ) {
  const sourceItemIdBySecondStepId = new Map(
    sourceableItems.map( item => [ item.secondStepId, item.id ] )
  );

  const talentUpdates = [];
  const pathUpdates = [];

  for ( const { id, adapted } of embeddedTalents ) {
    if ( adapted?.sourceSecondStepId === undefined ) continue;

    const sourceItemId = sourceItemIdBySecondStepId.get( adapted.sourceSecondStepId );
    if ( !sourceItemId ) {
      console.warn(
        `${ MODULE_ID } | Could not link talent (embedded id "${ id }") to its source "${ adapted.sourceSecondStepId }": no matching embedded item found.`,
      );
      continue;
    }

    const sourceUpdateData = { "system.source.class": sourceItemId };
    if ( adapted.atLevel !== undefined ) sourceUpdateData[ "system.source.atLevel" ] = adapted.atLevel;

    talentUpdates.push( { itemId: id, updateData: sourceUpdateData } );

    if ( adapted.isPathTalent ) {
      pathUpdates.push( {
        itemId:     sourceItemId,
        updateData: { "system.pathTalentId": id },
      } );
    }
  }

  return { talentUpdates, pathUpdates };
}

/**
 * Links an embedded questor item to its embedded questor devotion via `system.questorDevotionId`. Unlike
 * {@link linkTalentSources}, this requires no lookup: the questor adapter synthesizes the questor devotion
 * unconditionally, since SecondStep never exports it on its own. So the orchestrator already knows its embedded ID
 * directly from zipping the creation result, like with path talents.
 * @param {string} questorItemId - The real Foundry ID of the embedded questor item.
 * @param {string} questorDevotionItemId - The real Foundry ID of the embedded questor devotion item.
 * @returns {ClassAbilityLinkUpdate} The update payload to apply via `updateEmbeddedDocuments`.
 */
export function linkQuestorDevotion( questorItemId, questorDevotionItemId ) {
  return { itemId: questorItemId, updateData: { "system.questorDevotionId": questorDevotionItemId } };
}

/**
 * Zips an array of just-created Foundry documents with the adapted data objects they were created from, by position.
 * Only valid if both arrays were derived from the same source array, in the same order, without being reordered or
 * independently filtered since. This is true as long as the array passed to `createEmbeddedDocuments` is built directly
 * from the adapted data array.
 * @template T
 * @param {{ id: string }[]} createdDocuments - The documents returned by `createEmbeddedDocuments`.
 * @param {T[]} adaptedData - The adapted data objects the documents were created from, in the same order.
 * @returns {{ id: string, adapted: T }[]} The zipped pairs.
 * @throws {RangeError} If the two arrays do not have the same length.
 */
export function zipCreatedWithAdapted( createdDocuments, adaptedData ) {
  if ( createdDocuments.length !== adaptedData.length ) {
    throw new RangeError(
      `${ MODULE_ID } | Cannot zip created documents with adapted data; different lengths: ${ createdDocuments.length } vs ${ adaptedData.length }`,
    );
  }

  return createdDocuments.map( ( document, index ) => ( { id: document.id, adapted: adaptedData[ index ] } ) );
}
