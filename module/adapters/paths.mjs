/**
 * @import * from "../_types.mjs";
 * @import * from "../resolvers/item-resolver.mjs";
 */

/**
 * @typedef AdaptedPath
 * @property {ResolvedItem} resolved - The resolved path, with `system.level`set.
 * @property {string} linkedSecondStepId - The Second Step ID of the discipline this path is linked to.
 */

import { splitCamelCase } from "../utils/string.mjs";
import { resolveItem } from "../resolvers/item-resolver.mjs";
import { DEFAULT_IMAGES, ED4E_SYSTEM_TYPES } from "../constants/constants.mjs";

/**
 * Builds a minimal path item data object to use as the last-resort fallback if the path cannot be resolved
 * via the lookup tables or edid.
 * @param {ParsedPath} path - The parsed path to synthesize a fallback for.
 * @returns {object} The synthesized path item data.
 */
function synthesizePath( path ) {
  return {
    name:   splitCamelCase( path.id.id ),
    type:   ED4E_SYSTEM_TYPES.Item.path,
    img:    DEFAULT_IMAGES.Synthesized.path,
    system: {
      level: path.rank,
    },
  };
}

/**
 * Resolves every path from the parsed export into path item data.
 * Computes `system.level`.
 * @param {ParsedPath[]} paths - The parsed paths from {@link parseSecondStepExport}.
 * @returns {Promise<{ paths: AdaptedPath[] }>} The resolved path items.
 */
export async function adaptPaths( paths ) {
  const adaptedPaths = await Promise.all( paths.map( async ( path ) => {
    const resolved = await resolveItem(
      path.id,
      ED4E_SYSTEM_TYPES.Item.path,
      () => synthesizePath( path ),
    );

    resolved.data.system.level = path.rank;

    return {
      resolved,
      linkedSecondStepId: path.linked.secondStepId,
    };
  } ) );

  return { paths: adaptedPaths };
}