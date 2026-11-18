import { MODULE_ID } from "../constants/constants.mjs";
import { ensureImportMacro } from "../importers/import-macro.mjs";
import * as logging from "../logging/logging.mjs";

/**
 * Registers the one-time `ready` hook, which exposes the module's public API and makes sure the import macro exists.
 *
 * Once Foundry is ready, the API is available at `game.modules.get( "ed4e-steps2foundry" ).api` and contains:
 * - `importSecondStepCharacter( rawJson )`: Imports a SecondStep character export. Takes the JSON-parsed export
 * and returns a promise resolving to `{ actor, journal, report }`. `actor` is the created actor, `journal` is the
 * log journal entry (or `null` if none was created), and `report` is the import report.
 * See {@link importSecondStepCharacter} for details.
 * - `runImport()`: Asks the user for one or more files, imports them one after the other and writes an import log
 * journal. See {@link runImport} for details.
 *
 * @example
 * const api = game.modules.get( "ed4e-steps2foundry" ).api;
 * const { actor, journal, report } = await api.importSecondStepCharacter( JSON.parse( jsonText ) );
 */
export function ready() {
  Hooks.once( "ready", async () => {
    await ensureImportMacro();
    logging.log( `Module "${ MODULE_ID }" ready` );
  } );
}
