import { MODULE_ID } from "../constants/constants.mjs";
import { warn } from "../logging/logging.mjs";

/**
 * The command of the import macro. The logic stays in the module, so the macro never needs to change.
 * @type {string}
 */
export const IMPORT_MACRO_COMMAND = `const importer = game.modules.get( "${ MODULE_ID }" );
if ( !importer?.active ) return ui.notifications.error( "Steps2Foundry is not active." );
await importer.api.runImport();`;

/**
 * Creates the macro that starts the import in the world, if it does not exist yet. Only the active GM does this, so
 * that several GMs do not create it twice, and a user who deleted the macro on purpose gets a new one on the next
 * start only if no macro with the flag remains.
 * @returns {Promise<Macro|null>} The created macro, or `null` if nothing was created.
 */
export async function ensureImportMacro() {
  if ( !game.user.isGM ) return null;
  if ( game.users.activeGM && !game.users.activeGM.isSelf ) return null;

  const exists = game.macros.some( macro => macro.getFlag( MODULE_ID, "importMacro" ) === true );
  if ( exists ) return null;

  try {
    return await Macro.create( {
      name:    _loc( "S2F.Import.macroName" ),
      type:    "script",
      img:     "icons/svg/wall-direction.svg",
      command: IMPORT_MACRO_COMMAND,
      flags:   { [ MODULE_ID ]: { importMacro: true } },
    } );
  } catch ( cause ) {
    warn( "Could not create the import macro.", cause );
    return null;
  }
}
