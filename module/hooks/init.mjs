import * as logging from "../logging/logging.mjs";
import { MODULE_ID } from "../constants/constants.mjs";
import { importSecondStepCharacter } from "../importers/import-character.mjs";
import { runImport } from "../importers/run-import.mjs";

/**
 * Initializes the module by registering its settings and public API and logging its initialization.
 */
export function init() {
  Hooks.once( "init", () => {
    game.settings.register( MODULE_ID, "importMacroCreated", {
      scope:   "world",
      config:  false,
      type:    Boolean,
      default: false,
    } );
    game.modules.get( MODULE_ID ).api = { importSecondStepCharacter, runImport };
    logging.log( `Initializing "${ MODULE_ID }" module` );
  } );
}
