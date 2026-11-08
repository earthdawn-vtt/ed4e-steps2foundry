/**
 * @import * from "../_types.mjs";
 * @import * from "../resolvers/item-resolver.mjs";
 */

/**
 * @typedef AdaptedSkill
 * @property {ResolvedItem} resolved - The resolved skill, with `system.level` applied.
 * @property {UUID} uid - The UID of the parsed skill.
 */

import { resolveItem } from "../resolvers/item-resolver.mjs";
import {
  DEFAULT_IMAGES,
  ED4E_SKILL_TYPES,
  ED4E_SYSTEM_TYPES,
  SKILL_TYPE_FROM_SECOND_STEP_CATEGORY
} from "../constants/constants.mjs";

/**
 * Builds a minimal skill item data object to use as the last-resort fallback if the skill cannot be resolved
 * via the lookup tables or edid.
 * @param {ParsedSkill} skill - The parsed skill to synthesize a fallback for.
 * @returns {object} The synthesized skill item data.
 */
function synthesizeSkill( skill ) {
  return {
    name:   skill.id.id,
    type:   ED4E_SYSTEM_TYPES.Item.skill,
    img:    DEFAULT_IMAGES.Synthesized.skill,
    system: {
      attribute: skill.attribute,
      skillType: SKILL_TYPE_FROM_SECOND_STEP_CATEGORY[ skill.category ] ?? ED4E_SKILL_TYPES.general,
    },
  };
}

/**
 * Sets the name of the specialization in a knowledge or artisan skill data based on the parsed data. This assumes the
 * skill name does not have the specialization yet, meaning, the name has either empty parentheses "()" or just the
 * generic skill name without anything else.
 * Modifies `resolvedData` directly.
 * @param {object} resolvedData The {@link ResolvedItem#data} from the resolved skill.
 * @param {string|null} [name] The name of the specialization, if applicable.
 */
function applySpecialization( resolvedData, name ) {
  if ( !name ) return;

  // remove optional, empty brackets at the end of generic artisan/knowledge skill names
  const regex = /\s*\(\s*\)\s*$/;
  const genericSkillName = resolvedData.name?.replace( regex, "" );

  resolvedData.name = `${ genericSkillName } (${ name })`;
}

/**
 * Resolves every skill from the parsed export into skill item data.
 * Computes `system.level`, and data the orchestrator might need to later patch references to this skill.
 * @param {ParsedSkill[]} skills - The parsed skills from {@link parseSecondStepExport}.
 * @returns {Promise<{ skills: AdaptedSkill[] }>} The resolved skill items.
 */
export async function adaptSkills( skills ) {
  const adaptedSkills = await Promise.all( skills.map( async ( skill ) => {
    const resolved = await resolveItem(
      skill.id,
      ED4E_SYSTEM_TYPES.Item.skill,
      () => synthesizeSkill( skill ),
    );

    const resolvedData = resolved.data;

    resolvedData.system.level = skill.rank;
    if ( [ ED4E_SKILL_TYPES.artisan, ED4E_SKILL_TYPES.knowledge ].includes( resolvedData.system.skillType ) )
      applySpecialization( resolvedData, skill.name );

    return { resolved, uid: skill.uid };
  } ) );

  return { skills: adaptedSkills };
}