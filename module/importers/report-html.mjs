/**
 * @import * from "../_types.mjs"
 */

import { ITEM_ENTRY_KIND_ORDER } from "../constants/constants.mjs";
import { escapeHtml } from "../utils/string.mjs";

/**
 * Groups the unresolved items by kind, in the canonical order of the kinds. Unknown kinds come last.
 * @param {ImportReportItem[]} unresolved - The unresolved items.
 * @returns {[string, ImportReportItem[]][]} The groups.
 */
function groupByKind( unresolved ) {
  const groups = new Map();
  for ( const item of unresolved ) {
    if ( !groups.has( item.kind ) ) groups.set( item.kind, [] );
    groups.get( item.kind ).push( item );
  }

  const rank = kind => {
    const index = ITEM_ENTRY_KIND_ORDER.indexOf( kind );
    return index === -1 ? ITEM_ENTRY_KIND_ORDER.length : index;
  };
  // Array.prototype.sort is stable, so unknown kinds keep the order they came in.
  return [ ...groups.entries() ].sort( ( [ a ], [ b ] ) => rank( a ) - rank( b ) );
}

/**
 * Builds the HTML of the report of one imported file, for a text page of a journal.
 *
 * Lang keys, all with the data `{ count }` unless noted:
 * - `S2F.Report.heading.resolutions`, `.unresolved`, `.deferred` (no data)
 * - `S2F.Report.resolutions.uuid`, `.edid`, `.synthesized`
 * - `S2F.Report.kind.<kind>`
 * - `S2F.Report.deferred.<section>`
 * @param {ImportReport} report - The report of the import.
 * @returns {string} The HTML. Everything that comes from the file is escaped.
 */
export function buildReportHtml( report ) {
  const parts = [];

  parts.push( `<h3>${ _loc( "S2F.Report.heading.resolutions" ) }</h3>` );
  parts.push( "<ul>" );
  for ( const way of [ "uuid", "edid", "synthesized" ] ) {
    const count = report.resolutions[ way ];
    parts.push( `<li>${ _loc( `S2F.Report.resolutions.${ way }`, { count } ) }</li>` );
  }
  parts.push( "</ul>" );

  if ( report.unresolved.length > 0 ) {
    parts.push( `<h3>${ _loc( "S2F.Report.heading.unresolved" ) }</h3>` );
    for ( const [ kind, items ] of groupByKind( report.unresolved ) ) {
      const title = _loc( `S2F.Report.kind.${ kind }`, { count: items.length } );
      parts.push( `<h4>${ title }</h4>` );
      parts.push( "<ul>" );
      for ( const { name, secondStepId } of items ) {
        parts.push( `<li>${ escapeHtml( name ) } <code>${ escapeHtml( secondStepId ) }</code></li>` );
      }
      parts.push( "</ul>" );
    }
  }

  if ( report.deferred.length > 0 ) {
    parts.push( `<h3>${ _loc( "S2F.Report.heading.deferred" ) }</h3>` );
    parts.push( "<ul>" );
    for ( const { section, count } of report.deferred ) {
      parts.push( `<li>${ _loc( `S2F.Report.deferred.${ section }`, { count } ) }</li>` );
    }
    parts.push( "</ul>" );
  }

  return parts.join( "\n" );
}
