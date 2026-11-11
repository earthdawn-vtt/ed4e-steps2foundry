import { buildDescriptionHtml } from "./description.mjs";
import { ED4E_SYSTEM_TYPES } from "../constants/constants.mjs";

/**
 * @import * from "../_types.mjs";
 * @import * from "../adapters/attributes.mjs";
 */

/**
 * Builds the payload for `Actor.create`.
 * @param {ParsedExportData} parsedExport
 * @param {AdaptedAttributes} adaptedAttributes
 * @returns {object} The actor creation data.
 */
export function buildActorData( parsedExport, adaptedAttributes ) {
  const data = {
    name:   parsedExport.basics.name ?? _loc( "S2F.Character.unnamed" ),
    type:   ED4E_SYSTEM_TYPES.Actor.character,
    system: {
      attributes:      adaptedAttributes.attributes,
      karma:           { freeAttributePoints: adaptedAttributes.karma.freeAttributePoints },
      characteristics: {
        health: {
          damage: { standard: parsedExport.damage },
          wounds: parsedExport.wounds,
        },
      },
      description:     { value: buildDescriptionHtml( parsedExport.basics ) },
    },
  };
  if ( parsedExport.portraitUrl !== null ) data.img = parsedExport.portraitUrl;
  return data;
}