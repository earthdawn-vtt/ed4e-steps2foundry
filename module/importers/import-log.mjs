/**
 * @import * from "../_types.mjs"
 */

import { MODULE_ID } from "../constants/constants.mjs";
import { buildReportHtml } from "./report-html.mjs";
import { escapeHtml } from "../utils/string.mjs";

/** The distance between the `sort` values of two pages. */
const PAGE_SORT_STEP = 100;

/**
 * Formats a time as `YYYY-MM-DD HH:mm` in UTC.
 * @param {number} timestamp - Milliseconds since the epoch.
 * @returns {string} The formatted time.
 */
function formatUtc( timestamp ) {
  return new Date( timestamp ).toISOString().slice( 0, 16 ).replace( "T", " " );
}

/**
 * Builds the pages of one import attempt: one page on level 1 for the attempt, and one page on level 2 for each file.
 *
 * Lang keys:
 * - `S2F.Journal.attemptTitle` with `{ time }`, the time as `YYYY-MM-DD HH:mm` in UTC
 * - `S2F.Journal.attemptSummary` with `{ user, total, succeeded, failed }`. The username is escaped.
 * - `S2F.Journal.fileTitle` with `{ fileName, characterName }`, and `S2F.Journal.fileTitleFailed` with `{ fileName }`.
 *   Titles are plain text and are not escaped.
 * @param {ImportAttempt} attempt - The attempt to describe.
 * @param {number} [firstSort] - The `sort` value of the first page. Every page after it gets a higher one.
 * @returns {JournalPageData[]} The page data, in order.
 */
export function buildAttemptPages( attempt, firstSort = 0 ) {
  const { startedAt, userName, results } = attempt;
  const succeeded = results.filter( result => result.status === "success" ).length;

  const makePage = ( name, level, content, index ) => ( {
    name,
    type:  "text",
    title: { show: true, level },
    text:  { content, format: 1 },
    sort:  firstSort + index * PAGE_SORT_STEP,
  } );

  const summary = _loc( "S2F.Journal.attemptSummary", {
    user:      escapeHtml( userName ),
    total:     results.length,
    succeeded,
    failed:    results.length - succeeded,
  } );

  const pages = [
    makePage( _loc( "S2F.Journal.attemptTitle", { time: formatUtc( startedAt ) } ), 1, `<p>${ summary }</p>`, 0 ),
  ];

  results.forEach( ( result, i ) => {
    let name;
    let content;
    if ( result.status === "success" ) {
      name = _loc( "S2F.Journal.fileTitle", {
        fileName:      result.fileName,
        characterName: result.report.characterName,
      } );
      content = buildReportHtml( result.report );
    } else {
      name = _loc( "S2F.Journal.fileTitleFailed", { fileName: result.fileName } );
      content = `<p>${ escapeHtml( result.error.message ) }</p>`;
      if ( result.error.cause ) content += `\n<p>${ escapeHtml( result.error.cause ) }</p>`;
    }
    pages.push( makePage( name, 2, content, i + 1 ) );
  } );

  return pages;
}

/**
 * Finds the import journal of the user, or creates it.
 * @param {User} user - The user who imports.
 * @returns {Promise<JournalEntry>} The import journal of this user.
 */
export async function getOrCreateImportJournal( user ) {
  const existing = game.journal.find( journal => journal.flags?.[ MODULE_ID ]?.importLogUserId === user.id );
  if ( existing ) return existing;

  const { NONE, OWNER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;
  return JournalEntry.create( {
    name:      _loc( "S2F.Journal.importLogName", { userName: user.name } ),
    ownership: { default: NONE, [ user.id ]: OWNER },
    flags:     { [ MODULE_ID ]: { importLogUserId: user.id } },
  } );
}

/**
 * Appends an attempt to the import journal.
 * @param {JournalEntry} journal - The import journal.
 * @param {ImportAttempt} attempt - The attempt to add.
 * @returns {Promise<string>} The ID of the page of the attempt, so the journal can be opened at it.
 */
export async function appendAttempt( journal, attempt ) {
  const highestSort = journal.pages.reduce( ( max, page ) => Math.max( max, page.sort ), -PAGE_SORT_STEP );
  const pages = buildAttemptPages( attempt, highestSort + PAGE_SORT_STEP );

  // The ID is assigned here, so the page of the attempt is known without relying on the order of the result.
  const attemptPageId = foundry.utils.randomID();
  pages[ 0 ]._id = attemptPageId;

  await journal.createEmbeddedDocuments( "JournalEntryPage", pages, { keepId: true } );
  return attemptPageId;
}
