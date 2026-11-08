/**
 * @import * from "../_types.mjs";
 * @import * from "../resolvers/item-resolver.mjs";
 */

/**
 * @typedef AdaptedSpell
 * @property {ResolvedItem} resolved - The resolved spell, with no modification.
 */

import { DEFAULT_IMAGES, ED4E_SYSTEM_TYPES, SPELLCASTING_TYPE_FROM_SPELL_LETTER } from "../constants/constants.mjs";
import { splitCamelCase } from "../utils/string.mjs";
import { resolveItem } from "../resolvers/item-resolver.mjs";

/**
 * Builds a minimal spell item data object to use as the last-resort fallback if the spell cannot be resolved
 * via the lookup tables or edid.
 * @param {ParsedSpell} spell - The parsed spell to synthesize a fallback for.
 * @returns {object} The synthesized spell item data.
 */
function synthesizeSpell( spell ) {
  const { letter, name } = parseSpellLetter( spell.id.id );
  return {
    name:   splitCamelCase( name ),
    type:   ED4E_SYSTEM_TYPES.Item.spell,
    img:    DEFAULT_IMAGES.Synthesized.spell,
    system: {
      spellcastingType: SPELLCASTING_TYPE_FROM_SPELL_LETTER[ letter?.toLowerCase() ],
    },
  };
}

/**
 * Whether the spell ID has an identifying character at the beginning for the spellcasting type.
 * @param {string} spellId
 * @returns {boolean} `True` if the second letter is uppercase and the first is in
 * {@link SPELLCASTING_TYPE_FROM_SPELL_LETTER }. `False` otherwise and for anything other than a string.
 */
function hasSpellLetter( spellId ) {
  return typeof spellId === "string"
    && spellId.length > 1
    && spellId[1] === spellId[1].toUpperCase() // digits count as upper case here
    && Object.keys( SPELLCASTING_TYPE_FROM_SPELL_LETTER ).includes( spellId[0].toLowerCase() );
}

/**
 * Separates a recognized spellcasting-type prefix from a spell ID using {@link hasSpellLetter}.
 * Leaves the name unchanged and the letter undefined when no prefix is recognized.
 * @param {string} spellId - The spell ID to parse.
 * @returns {{ letter: string|undefined, name: string }|undefined} The prefix and remaining name,
 * or undefined for an empty string or a non-string value.
 */
function parseSpellLetter( spellId ) {
  if ( typeof spellId !== "string" || spellId.length === 0 ) return;

  let letter;
  let name = spellId;

  if ( hasSpellLetter( spellId ) ) {
    letter = spellId[0];
    name = spellId.substring( 1, );
  }
  return {
    letter,
    name,
  };
}

/**
 * Resolves every spell from the parsed export into spell item data.
 * Does not any additional information as those are not provided by Second Step.
 * @param {ParsedSpell[]} spells The parsed spells from {@link parseSecondStepExport}.
 * @returns {Promise<{ spells: AdaptedSpell[] }>} The resolved spell items.
 */
export async function adaptSpells( spells ) {
  const adaptedSpells  = await Promise.all( spells.map( async ( spell ) => {
    const resolved = await resolveItem(
      spell.id,
      ED4E_SYSTEM_TYPES.Item.spell,
      () => synthesizeSpell( spell ),
    );

    return { resolved, };
  } ) );

  return { spells: adaptedSpells };
}