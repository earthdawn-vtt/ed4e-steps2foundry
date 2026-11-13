/**
 * @import { ImportReport, SecondStepExport } from "../_types.mjs";
 */

import { parseSecondStepExport } from "../parsers/parsing.mjs";
import { adaptCharacter } from "./adapt-character.mjs";
import { createCharacter } from "./create-character.mjs";
import { buildImportReport } from "./report.mjs";

/**
 * Imports a SecondStep character: parses the export, adapts it, creates the actor (and log journal), and builds a
 * report about the import.
 * @param {SecondStepExport} rawJson - The raw, JSON-parsed SecondStep export.
 * @returns {Promise<{ actor: Actor, journal: JournalEntry|null, report: ImportReport }>} The created documents and
 * the import report.
 */
export async function importSecondStepCharacter( rawJson ) {
  const parsed = parseSecondStepExport( rawJson );
  const adaptedCharacter = await adaptCharacter( parsed );
  const { actor, journal } = await createCharacter( adaptedCharacter );
  const report = buildImportReport( adaptedCharacter );

  return { actor, journal, report };
}
