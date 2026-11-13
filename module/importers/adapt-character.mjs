/**
 * @import { AdaptedCharacter, ParsedExportData } from "../_types.mjs";
 */

import { adaptAttributes } from "../adapters/attributes.mjs";
import { adaptDisciplines } from "../adapters/disciplines.mjs";
import { adaptPaths } from "../adapters/paths.mjs";
import { adaptQuestor } from "../adapters/questor.mjs";
import { adaptTalents } from "../adapters/talents.mjs";
import { adaptSkills } from "../adapters/skills.mjs";
import { adaptSpells } from "../adapters/spells.mjs";
import { adaptEquipment } from "../adapters/equipment.mjs";
import { buildActorData } from "./actor-data.mjs";
import { buildLogJournalData } from "./journal.mjs";
import { buildItemEntries } from "./item-entries.mjs";

/**
 * Runs all adapters on the parsed export and assembles everything needed to create the character.
 * @param {ParsedExportData} parsed - The parsed SecondStep export.
 * @returns {Promise<AdaptedCharacter>} The adapted character.
 */
export async function adaptCharacter( parsed ) {
  const [
    attributesResult,
    disciplineResult,
    pathResult,
    questorResult,
    talentResult,
    skillResult,
    spellResult,
    equipmentResult,
  ] = await Promise.all( [
    adaptAttributes( parsed.namegiver, parsed.attributes, parsed.meta.attributePoints ),
    adaptDisciplines( parsed.disciplines ),
    adaptPaths( parsed.paths ),
    parsed.questor ? adaptQuestor( parsed.questor ) : null,
    adaptTalents( parsed.talents ),
    adaptSkills( parsed.skills ),
    adaptSpells( parsed.spells ),
    adaptEquipment( parsed.equipment ),
  ] );

  return {
    actorData:   buildActorData( parsed, attributesResult ),
    journalData: buildLogJournalData( parsed.basics ),
    entries:     buildItemEntries( {
      namegiver:   attributesResult.namegiver,
      disciplines: disciplineResult.disciplines,
      paths:       pathResult.paths,
      questor:     questorResult,
      talents:     talentResult.talents,
      skills:      skillResult.skills,
      spells:      spellResult.spells,
      equipment:   equipmentResult.equipment,
    } ),
    deferred:    {
      threadItems:     equipmentResult.threadItems.length,
      matrixGrants:    talentResult.matrixGrants.length,
      knacks:          parsed.knacks.length,
      magic:           parsed.magic.length,
      effects:         parsed.effects.length,
      homebrewEffects: parsed.homebrewEffects.length,
      legendPoints:    parsed.legendPoints,
    },
  };
}
