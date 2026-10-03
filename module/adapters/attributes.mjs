/**
 * @import { ParsedIdSource, ParsedAttributes } from "../_types.mjs";
 * @import { ResolvedItem } from "../resolvers/item-resolver.mjs";
 */

/**
 * @typedef AdaptedAttributes
 * @property {ResolvedItem} namegiver - The resolved namegiver item.
 * @property {Record<string, { initialValue: number, timesIncreased: number}>} attributes - The computed actor,
 * attribute data, keyed by the 3-letter abbreviation of the attribute.
 * @property {{ freeAttributePoints: number }} karma - The computed leftover attribute points.
 */

import { ATTRIBUTE_ABBREVIATION, ATTRIBUTE_MODIFIER_FROM_COST } from "../constants/constants.mjs";
import { resolveItem } from "../resolvers/item-resolver.mjs";

/**
 * The schema default base attribute value used when the namegiver cannot be resolved at all.
 * @type {number}
 */
const DEFAULT_NAMEGIVER_ATTRIBUTE_VALUE = 10;

/**
 * Builds a minimal namegiver item data object to use as the last-resort fallback if the namegiver cannot be
 * resolved via the lookup tables or edid. Every attribute falls back to the schema default base value, since
 * no real base values are available.
 * @param {ParsedIdSource} idSource - The parsed SecondStep ID of the namegiver.
 * @returns {object} The synthesized namegiver item data.
 */
function synthesizeNamegiver( idSource ) {
  return {
    name:   idSource.id,
    type:   "namegiver",
    img:    "icons/svg/mystery-man.svg",
    system: {
      attributeValues: Object.fromEntries(
        ATTRIBUTE_ABBREVIATION.map( abbreviation => [ abbreviation, DEFAULT_NAMEGIVER_ATTRIBUTE_VALUE ] )
      ),
    }
  };
}

/**
 * Looks up the attribute modifier for a given SecondStep buildpoint/increase cost.
 * @param {number} cost - The raw SecondStep cost value, i.e., `Buildpoints`.
 * @returns {number} The resulting attribute modifier.
 * @throws {RangeError} If the cost does not match any known SecondStep attribute cost tier.
 */
function getAttributeModifier( cost ) {
  const modifier = ATTRIBUTE_MODIFIER_FROM_COST[ cost ];
  if ( modifier === undefined ) {
    throw new RangeError( `Unrecognized SecondStep attribute buildpoint cost: ${cost}` );
  }
  return modifier;
}

/**
 * Resolves the namegiver referenced by the parsed export and computes the resulting actor attribute data
 * (`initialValue`/`timesIncreased`) plus leftover `karma.freeAttributePoints`. Only the buildpoint cost
 * (not the increase count) is run through ed4e's attribute cost table, since SecondStep's `Increases` field
 * is already the plain "times increased" count the actor schema expects directly.
 * @param {ParsedIdSource} namegiverIdSource - The parsed namegiver ID from `parseSecondStepExport`.
 * @param {ParsedAttributes} parsedAttributes - The parsed attribute data from `parseSecondStepExport`.
 * @param {number} attributePoints - The total attribute points available at character creation
 * (`meta.attributePoints`).
 * @returns {Promise<AdaptedAttributes>} The resolved namegiver item plus the computed attribute/karma data.
 * @throws {RangeError} If any attribute's buildpoint cost does not match a known SecondStep attribute cost tier.
 */
export async function adaptAttributes( namegiverIdSource, parsedAttributes, attributePoints ) {
  const namegiver = await resolveItem(
    namegiverIdSource,
    "namegiver",
    () => synthesizeNamegiver( namegiverIdSource ),
  );

  const baseAttributeValues = namegiver.data.system.attributeValues;

  const attributes = {};
  let spentAttributePoints = 0;

  for ( const abbreviation of ATTRIBUTE_ABBREVIATION ) {
    const { buildPoints, increases } = parsedAttributes[ abbreviation ];
    const modifier = getAttributeModifier( buildPoints );

    attributes[ abbreviation ] = {
      initialValue:   baseAttributeValues[ abbreviation ] + modifier,
      timesIncreased: increases,
    };

    spentAttributePoints += buildPoints;
  }

  return {
    namegiver,
    attributes,
    karma: {
      freeAttributePoints: attributePoints - spentAttributePoints,
    },
  };
}
