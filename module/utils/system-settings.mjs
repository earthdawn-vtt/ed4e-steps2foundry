/**
 * The edid that makes an item a matrix in ed4e. Read from the system setting, as the user may have changed it.
 * @returns {string} The configured matrix edid, or `"matrix"` if the setting is empty or not registered.
 */
export function getMatrixEdid() {
  try {
    return game.settings.get( "ed4e", "edidSpellMatrix" ) || "matrix";
  } catch ( error ) {
    console.warn( "ed4e-steps2foundry | Could not read the matrix edid setting, using \"matrix\".", error );
    return "matrix";
  }
}
