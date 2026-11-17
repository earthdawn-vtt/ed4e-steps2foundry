/**
 * @import * from "../_types.mjs"
 */

import { promptForSecondStepFiles } from "../applications/import-prompt.mjs";
import { error as logError, warn as logWarn } from "../logging/logging.mjs";
import { describeImportError, getImportErrorMessage } from "./import-error.mjs";
import { importSecondStepCharacter } from "./import-character.mjs";
import { appendAttempt, getOrCreateImportJournal } from "./import-log.mjs";
import { readSecondStepFile } from "./read-export-file.mjs";

/** Keeps a second import from starting while one is running. */
let importRunning = false;

/**
 * Writes the import log. Best effort: a failure only produces a warning.
 * @param {ImportAttempt} attempt - The attempt to log.
 * @returns {Promise<{ journal: JournalEntry, pageId: string }|null>} The log journal and the page of the attempt.
 */
async function writeImportLog( attempt ) {
  try {
    const journal = await getOrCreateImportJournal( game.user );
    const pageId = await appendAttempt( journal, attempt );
    return { journal, pageId };
  } catch ( cause ) {
    logWarn( "Could not write the import log.", cause );
    return null;
  }
}

/**
 * Lets the user select Second Step files and imports them one after the other.
 * Every file is imported on its own, so one broken file does not stop the others.
 * @returns {Promise<void>}
 */
export async function runImport() {
  if ( importRunning ) {
    ui.notifications.warn( _loc( "S2F.Import.alreadyRunning" ) );
    return;
  }
  importRunning = true;

  try {
    const files = await promptForSecondStepFiles();
    if ( !files?.length ) return;

    const startedAt = Date.now();
    const results = [];
    const imported = [];

    for ( const file of files ) {
      try {
        const raw = await readSecondStepFile( file );
        const { actor, journal, report } = await importSecondStepCharacter( raw );
        results.push( { fileName: file.name, status: "success", report } );
        imported.push( { actor, journal } );
      } catch ( thrown ) {
        logError( `Importing "${ file.name }" failed.`, thrown );
        ui.notifications.error( `${ file.name }: ${ getImportErrorMessage( thrown ) }` );
        results.push( { fileName: file.name, status: "failed", error: describeImportError( thrown ) } );
      }
    }

    const log = await writeImportLog( { startedAt, userName: game.user.name, results } );

    if ( files.length === 1 && imported.length === 1 ) {
      const [ { actor, journal } ] = imported;
      actor.sheet?.render( { force: true } );
      journal?.sheet?.render( { force: true } );
    }
    log?.journal.sheet?.render( { force: true, pageId: log.pageId } );

    if ( imported.length > 0 ) {
      ui.notifications.info( _loc( "S2F.Import.imported", { count: imported.length, total: files.length } ) );
    }
  } finally {
    importRunning = false;
  }
}
