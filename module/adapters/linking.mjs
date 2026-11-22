/**
 * @import { AdaptedTalent } from "./talents.mjs";
 * @import { AdaptedPath } from "./paths.mjs";
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

/**
 * @typedef EmbeddedPath
 * @property {string} id - The real Foundry ID of the embedded item on the actor.
 * @property {AdaptedPath} adapted - The adapted path data this embedded item was created from.
 */

/**
 * @typedef EmbeddedMatrix
 * @property {string} id - The ID of the embedded talent or equipment that is a matrix.
 * @property {string|undefined} matrixSpellSecondStepId - The Second Step ID of the spell attuned to it.
 */

import { warn } from "../logging/logging.mjs";

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
      warn(
        `Could not link talent (embedded id "${ id }") to its source "${ adapted.sourceSecondStepId }": no matching embedded item found.`,
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
 * Links every embedded path that has a resolvable `linkedSecondStepId` to the real Foundry ID of its embedded
 * discipline item.
 *
 * Paths with `linkedSecondStepId === undefined` (like from namegivers or effects) are left untouched, since there is
 * no `source` for them right now.
 * @param {EmbeddedPath[]} embeddedPaths - The paths already embedded in the actor, paired with the adapted data
 * they were created from.
 * @param {SourceableEmbeddedItem[]} disciplineItems - The disciplines already embedded in the actor that paths may be
 * sourced from.
 * @returns {ClassAbilityLinkUpdate[]} The update payloads to apply via `updateEmbeddedDocuments`.
 */
export function linkPathDisciplines( embeddedPaths, disciplineItems ) {
  const sourceItemIdBySecondStepId = new Map(
    disciplineItems.map( item => [ item.secondStepId, item.id ] )
  );

  const updates = [];

  for ( const { id, adapted } of embeddedPaths ) {
    if ( adapted?.linkedSecondStepId === undefined ) continue;

    const disciplineItemId = sourceItemIdBySecondStepId.get( adapted.linkedSecondStepId );
    if ( !disciplineItemId ) {
      warn(
        `Could not link path (embedded id "${ id }") to its source "${ adapted.linkedSecondStepId }": no matching embedded item found.`
      );
      continue;
    }

    const sourceUpdateData = { "system.sourceDisciplineId": disciplineItemId };

    updates.push( { itemId: id, updateData: sourceUpdateData } );
  }

  return updates;
}

/**
 * Links every embedded matrix to its attuned embedded spell via `system.matrix.spells`. Matrices without a spell get
 * no update. A spell that is not embedded produces a warning, and that matrix is skipped.
 * @param {EmbeddedMatrix[]} embeddedMatrices - The embedded talents and equipment that are matrices.
 * @param {SourceableEmbeddedItem[]} embeddedSpells - The embedded spells, as `{ id, secondStepId }`.
 * @returns {ClassAbilityLinkUpdate[]} The update payloads to apply via `updateEmbeddedDocuments`.
 */
export function linkMatrixSpells( embeddedMatrices, embeddedSpells ) {
  const spellIdBySecondStepId = new Map(
    embeddedSpells.map( spell => [ spell.secondStepId, spell.id ] )
  );

  const updates = [];

  for ( const { id, matrixSpellSecondStepId } of embeddedMatrices ) {
    if ( matrixSpellSecondStepId === undefined ) continue;

    const spellId = spellIdBySecondStepId.get( matrixSpellSecondStepId );
    if ( !spellId ) {
      warn(
        `Could not link matrix (embedded id "${ id }") to its spell "${ matrixSpellSecondStepId }": no matching embedded spell found.`
      );
      continue;
    }

    updates.push( { itemId: id, updateData: { "system.matrix.spells": [ spellId ] } } );
  }

  return updates;
}

/**
 * Merge update payloads that share an {@link ClassAbilityLinkUpdate#itemId}.
 * @param {ClassAbilityLinkUpdate[]} updates The updates to merge. Does not get modified.
 * @returns {ClassAbilityLinkUpdate[]} The merged updates, with one payload per `itemId`.
 */
export function mergeLinkUpdates( updates ) {
  const updatesByItemId = new Map();

  for ( const { itemId, updateData } of updates ) {
    const mergedUpdateData = {  ...updatesByItemId.get( itemId )?.updateData, ...updateData };
    updatesByItemId.set( itemId, { itemId, updateData: mergedUpdateData } );
  }

  return Array.from( updatesByItemId.values() );
}
