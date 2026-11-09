/**
 * @import * from "../_types.mjs";
 * @import * from "../resolvers/item-resolver.mjs";
 */

/**
 * @typedef AdaptedDiscipline
 * @property {ResolvedItem} resolved - The resolved discipline, with `system.level` and `system.order` applied.
 */

import { resolveItem } from "../resolvers/item-resolver.mjs";
import { DEFAULT_IMAGES, ED4E_SYSTEM_TYPES } from "../constants/constants.mjs";
import { splitCamelCase } from "../utils/string.mjs";

/**
 * Builds a minimal discipline item data object to use as the last-resort fallback if the discipline cannot be resolved
 * via the lookup tables or edid.
 * @param {ParsedDiscipline} discipline - The parsed discipline to synthesize a fallback for.
 * @returns {object} The synthesized discipline item data.
 */
function synthesizeDiscipline( discipline ) {
  return {
    name:   splitCamelCase( discipline.id.id ),
    type:   ED4E_SYSTEM_TYPES.Item.discipline,
    img:    DEFAULT_IMAGES.Synthesized.discipline,
    system: {
      level: discipline.circle,
      order: discipline.order + 1,
    },
  };
}

/**
 * Resolves every discipline from the parsed export into discipline item data.
 * Computes `system.level` and `system.order`.
 * @param {ParsedDiscipline[]} disciplines - The parsed disciplines from {@link parseSecondStepExport}.
 * @returns {Promise<{ disciplines: AdaptedDiscipline[] }>} The resolved discipline items.
 */
export async function adaptDisciplines( disciplines ) {
  const adaptedDisciplines = await Promise.all( disciplines.map( async ( discipline ) => {
    const resolved = await resolveItem(
      discipline.id,
      ED4E_SYSTEM_TYPES.Item.discipline,
      () => synthesizeDiscipline( discipline ),
    );

    resolved.data.system.level = discipline.circle;
    resolved.data.system.order = discipline.order + 1;

    return { resolved };
  } ) );

  return { disciplines: adaptedDisciplines };
}