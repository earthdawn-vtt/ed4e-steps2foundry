/**
 * @import { ItemEntry } from "../_types.mjs";
 * @import { ResolvedItem } from "../resolvers/item-resolver.mjs";
 * @import { AdaptedDiscipline } from "../adapters/disciplines.mjs";
 * @import { AdaptedPath } from "../adapters/paths.mjs";
 * @import { AdaptedQuestorResult } from "../adapters/questor.mjs";
 * @import { AdaptedTalent } from "../adapters/talents.mjs";
 * @import { AdaptedSkill } from "../adapters/skills.mjs";
 * @import { AdaptedSpell } from "../adapters/spells.mjs";
 * @import { AdaptedEquipment } from "../adapters/equipment.mjs";
 */

/**
 * Builds the ordered list of all items to embed in the actor. The order is fixed: namegiver, disciplines, paths,
 * questor, questor devotion, talents, skills, spells, equipment.
 * @param {object} input
 * @param {ResolvedItem} input.namegiver - The resolved namegiver item.
 * @param {AdaptedDiscipline[]} input.disciplines - The adapted disciplines.
 * @param {AdaptedPath[]} input.paths - The adapted paths.
 * @param {AdaptedQuestorResult|null} input.questor - The adapted questor, or `null` if there is none.
 * @param {AdaptedTalent[]} input.talents - The adapted talents.
 * @param {AdaptedSkill[]} input.skills - The adapted skills.
 * @param {AdaptedSpell[]} input.spells - The adapted spells.
 * @param {AdaptedEquipment[]} input.equipment - The adapted equipment.
 * @returns {ItemEntry[]} The item entries.
 */
export function buildItemEntries( input ) {
  const { namegiver, disciplines, paths, questor, talents, skills, spells, equipment } = input;

  const entries = [ { kind: "namegiver", resolved: namegiver } ];

  for ( const { resolved } of disciplines ) entries.push( { kind: "discipline", resolved } );
  for ( const adapted of paths ) entries.push( { kind: "path", resolved: adapted.resolved, adapted } );

  if ( questor ) {
    entries.push( { kind: "questor", resolved: questor.questor.resolved } );
    entries.push( { kind: "questorDevotion", resolved: questor.devotion.resolved } );
  }

  for ( const adapted of talents ) entries.push( { kind: "talent", resolved: adapted.resolved, adapted } );
  for ( const { resolved } of skills ) entries.push( { kind: "skill", resolved } );
  for ( const { resolved } of spells ) entries.push( { kind: "spell", resolved } );
  for ( const { resolved } of equipment ) entries.push( { kind: "equipment", resolved } );

  return entries;
}
