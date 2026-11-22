/**
 * @import * from "../_types.mjs";
 * @import * from "../resolvers/item-resolver.mjs";
 */

/**
 * @typedef AdaptedKnack
 * @property {ResolvedItem} resolved - The resolved knack. Its `itemType` is the actual type of the item.
 */

import { DEFAULT_IMAGES, ED4E_SYSTEM_TYPES } from "../constants/constants.mjs";
import { splitCamelCase } from "../utils/string.mjs";
import { resolveItem } from "../resolvers/item-resolver.mjs";

/** An improved spell knack has the ID of its spell embedded, so a second source tag appears after the start. */
const EMBEDDED_SOURCE_TAG = /.ED4/;

const isRecognizableKnackAbility = knack => knack.attribute !== null && !EMBEDDED_SOURCE_TAG.test( knack.id.id );

/**
 * The item types a knack can resolve to.
 * @type {readonly string[]}
 */
const KNACK_ITEM_TYPES = Object.freeze( [
  ED4E_SYSTEM_TYPES.Item.knackAbility,
  ED4E_SYSTEM_TYPES.Item.knackKarma,
  ED4E_SYSTEM_TYPES.Item.knackManeuver,
  ED4E_SYSTEM_TYPES.Item.spellKnack,
] );

/**
 * Builds a minimal knack ability item data object to use as the last-resort fallback if the knack cannot be resolved
 * via the lookup tables or edid. The name is derived from the ID and therefore lossy.
 * @param {ParsedKnack} knack - The parsed knack to synthesize a fallback for.
 * @returns {object} The synthesized knack item data.
 */
function synthesizeKnack( knack ) {
  return {
    name:   splitCamelCase( knack.id.id ),
    type:   ED4E_SYSTEM_TYPES.Item.knackAbility,
    img:    DEFAULT_IMAGES.Synthesized.knack,
    system: {
      attribute: knack.attribute,
    },
  };
}

/**
 * Resolves every knack from the parsed export into knack item data. A knack that has no compendium match is only
 * synthesized if it is clearly a knack ability, meaning it has an attribute. Any other knack that is not found is
 * skipped. Does not set `sourceItem`, as it cannot be derived reliably.
 * @param {ParsedKnack[]} knacks - The parsed knacks from {@link parseSecondStepExport}.
 * @returns {Promise<{ knacks: AdaptedKnack[], skipped: ParsedKnack[] }>} The resolved knacks, and the knacks that
 * were skipped, in input order.
 */
export async function adaptKnacks( knacks ) {
  const resolvedKnacks = await Promise.all( knacks.map( knack => resolveItem(
    knack.id,
    KNACK_ITEM_TYPES,
    () => synthesizeKnack( knack ),
  ) ) );

  const adaptedKnacks = [];
  const skipped = [];
  knacks.forEach( ( knack, index ) => {
    const resolved = resolvedKnacks[ index ];
    if ( resolved.resolution === "synthesized" && !isRecognizableKnackAbility( knack ) ) {
      skipped.push( knack );
      return;
    }
    adaptedKnacks.push( { resolved } );
  } );

  return { knacks: adaptedKnacks, skipped };
}
