/**
 * @import * from "../_types.mjs";
 */

import { escapeHtml } from "../utils/string.mjs";
import { NORMALIZED_SECOND_STEP_BASICS_DESCRIPTOR_FIELDS } from "../constants/constants.mjs";

/**
 * Build the description HTML: the original description followed by a table of the basic character data.
 * @param {ParsedBasics} basics The parsed {@link ParsedExportData#basics}.
 * @returns {string} The HTML for the characters `description` field.
 */
export function buildDescriptionHtml( basics ) {
  const rows = Object.values( NORMALIZED_SECOND_STEP_BASICS_DESCRIPTOR_FIELDS )
    .filter( field => basics[field] !== null && basics[field] !== undefined )
    .map( field => {
      const label = escapeHtml( _loc( `S2F.Description.${ field }` ) );
      return `<tr><th>${ label }</th><td>${ escapeHtml( basics[field] ) }</td></tr>`;
    } );
  const description = basics.description ?? "";
  if ( rows.length === 0 ) return description;
  return `${ description }<table><tbody>${ rows.join( "" ) }</tbody></table>`;
}
