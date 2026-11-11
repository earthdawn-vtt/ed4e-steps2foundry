/**
 * @import * from "../_types.mjs";
 */

/**
 * Build the data for a JournalEntry containing the player's log.
 * @param {ParsedBasics} basics The parsed {@link ParsedExportData#basics}.
 * @returns {object|null} The JournalEntry data, or `null` if the log text is empty.
 */
export function buildLogJournalData( basics ) {
  const logText = basics.logText;
  if ( !logText ) return null;
  return {
    name:  _loc(
      "S2F.Journal.logJournalName",
      { characterName: basics.name ?? _loc( "S2F.Character.unnamed" ) },
    ),
    pages: [ {
      name: _loc( "S2F.Journal.logPageName" ),
      type: "text",
      text: { content: logText, format: 1 },
    } ],
  };
}