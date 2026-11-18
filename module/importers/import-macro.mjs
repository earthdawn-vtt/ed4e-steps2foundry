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
 * that several GMs do not create it twice. The world setting `importMacroCreated` remembers that the macro was
 * created once, so a macro that was deleted on purpose does not come back.
 * @returns {Promise<Macro|null>} The created macro, or `null` if nothing was created.
 */
export async function ensureImportMacro() {
  if ( !game.user.isGM ) return null;
  if ( game.users.activeGM && !game.users.activeGM.isSelf ) return null;

  const created = game.settings.get( MODULE_ID, "importMacroCreated" ) === true;
  const exists = game.macros.some( macro => macro.getFlag( MODULE_ID, "importMacro" ) === true );
  if ( exists ) {
    if ( !created ) await game.settings.set( MODULE_ID, "importMacroCreated", true );
    return null;
  }
  if ( created ) return null;

  try {
    const macro = await Macro.create( {
      name:      _loc( "S2F.Import.macroName" ),
      type:      "script", 
      img:       "icons/svg/wall-direction.svg",
      command:   IMPORT_MACRO_COMMAND,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      flags:     { [ MODULE_ID ]: { importMacro: true } },
    } );
    await game.settings.set( MODULE_ID, "importMacroCreated", true );
    return macro;
  } catch ( cause ) {
    warn( "Could not create the import macro.", cause );
    return null;
  }
}
