import { MODULE_ID } from "../constants/constants.mjs";
import { importSecondStepCharacter } from "../importers/import-character.mjs";
import * as logging from "../logging/logging.mjs";

/**
 * Registers the one-time `ready` hook, which exposes the module's public API.
 *
 * Once Foundry is ready, the API is available at `game.modules.get( "ed4e-steps2foundry" ).api` and contains:
 * - `importSecondStepCharacter( rawJson )`: Imports a SecondStep character export. Takes the JSON-parsed export
 * and returns a promise resolving to `{ actor, journal, report }`. `actor` is the created actor, `journal` is the
 * log journal entry (or `null` if none was created), and `report` is the import report.
 * See {@link importSecondStepCharacter} for details.
 *
 * @example
 * const api = game.modules.get( "ed4e-steps2foundry" ).api;
 * const { actor, journal, report } = await api.importSecondStepCharacter( JSON.parse( jsonText ) );
 */
export function ready() {
  Hooks.once( "ready", () => {
    game.modules.get( MODULE_ID ).api = { importSecondStepCharacter, };
    logging.log( `Module "${ MODULE_ID }" ready` );
  } );
}