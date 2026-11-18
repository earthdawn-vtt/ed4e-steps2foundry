/**
 * Asks the user for the files to import.
 * @returns {Promise<File[]|null|undefined>} The selected files, `undefined` if the user canceled, or `null` if they
 * selected nothing.
 */
export async function promptForSecondStepFiles() {
  const files = await foundry.applications.api.DialogV2.prompt( {
    window:      { title: _loc( "S2F.Import.dialogTitle" ) },
    content:     `<div class="form-group"><label>${ _loc( "S2F.Import.chooseFiles" ) }</label>`
      + "<input type=\"file\" name=\"files\" accept=\".json,application/json\" multiple></div>",
    ok:          {
      label:    _loc( "S2F.Import.import" ),
      callback: ( event, button ) => Array.from( button.form.elements.files.files ),
    },
    rejectClose: false,
  } );

  if ( files === null ) return null;

  return Array.isArray( files ) && files.length > 0 ? files : undefined;
}
