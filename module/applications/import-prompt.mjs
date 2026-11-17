/**
 * Asks the user for the files to import.
 * @returns {Promise<File[]|null>} The selected files, or `null` if the user cancelled or selected nothing.
 */
export async function promptForSecondStepFiles() {
  const files = await foundry.applications.api.DialogV2.prompt( {
    window:      { title: _loc( "S2F.Import.dialogTitle" ) },
    content:     `<div class="form-group"><label>${ _loc( "S2F.Import.chooseFiles" ) }</label>`
      + `<input type="file" name="files" accept=".json,application/json" multiple></div>`,
    ok:          {
      label:    _loc( "S2F.Import.import" ),
      callback: ( event, button ) => Array.from( button.form.elements.files.files ),
    },
    rejectClose: false,
  } );

  return Array.isArray( files ) && files.length > 0 ? files : null;
}
