/**
 * @import { AdaptedCharacter } from "../_types.mjs";
 */

import { SecondStepImportError } from "./errors.mjs";
import {
  linkPathDisciplines,
  linkQuestorDevotion,
  linkTalentSources,
  mergeLinkUpdates,
  zipCreatedWithAdapted,
} from "../adapters/linking.mjs";
import { error } from "../logging/logging.mjs";

/**
 * Checks that the current user may create everything the import needs. Nothing has been created at this point.
 * @param {AdaptedCharacter} adaptedCharacter - The adapted character.
 * @throws {SecondStepImportError} If the user lacks a required permission.
 */
function assertCanCreate( adaptedCharacter ) {
  if ( !game.user.can( "ACTOR_CREATE" ) )
    throw new SecondStepImportError( _loc( "S2F.Error.noActorPermission" ), );

  if ( adaptedCharacter.journalData && !game.user.can( "JOURNAL_CREATE" ) )
    throw new SecondStepImportError( _loc( "S2F.Error.noJournalPermission" ), );
}

/**
 * Embeds all items in the actor and links them to each other.
 * @param {Actor} actor - The created actor.
 * @param {import("../_types.mjs").ItemEntry[]} entries - The item entries to embed.
 */
async function embedItems( actor, entries ) {
  const created = await actor.createEmbeddedDocuments( "Item", entries.map( entry => entry.resolved.data ) );
  const zipped = zipCreatedWithAdapted( created, entries );
  const ofKind = kind => zipped.filter( ( { adapted: entry } ) => entry.kind === kind );

  const sourceableItems = [ ...ofKind( "discipline" ), ...ofKind( "path" ) ].map(
    ( { id, adapted: entry } ) => ( { id, secondStepId: entry.resolved.secondStepId } )
  );
  const embeddedTalents = ofKind( "talent" ).map( ( { id, adapted: entry } ) => ( { id, adapted: entry.adapted } ) );
  const embeddedPaths = ofKind( "path" ).map( ( { id, adapted: entry } ) => ( { id, adapted: entry.adapted } ) );

  const { talentUpdates, pathUpdates } = linkTalentSources( embeddedTalents, sourceableItems );
  const pathDisciplineUpdates = linkPathDisciplines( embeddedPaths, sourceableItems );

  const questor = ofKind( "questor" )[ 0 ];
  const devotion = ofKind( "questorDevotion" )[ 0 ];
  const questorUpdates = questor && devotion ? [ linkQuestorDevotion( questor.id, devotion.id ) ] : [];

  const updates = [
    ...talentUpdates,
    ...mergeLinkUpdates( [ ...pathUpdates, ...pathDisciplineUpdates, ...questorUpdates ] ),
  ].map( ( { itemId, updateData } ) => ( { _id: itemId, ...updateData } ) );

  if ( updates.length > 0 ) await actor.updateEmbeddedDocuments( "Item", updates );
}

/**
 * Creates the actor with all its items and, if present, the log journal from an adapted character. If anything
 * fails after the actor was created, the actor is deleted again.
 * @param {AdaptedCharacter} adaptedCharacter - The adapted character.
 * @returns {Promise<{ actor: Actor, journal: JournalEntry|null }>} The created documents.
 * @throws {SecondStepImportError} If a permission is missing or any creation step fails.
 */
export async function createCharacter( adaptedCharacter ) {
  assertCanCreate( adaptedCharacter );

  const { actorData, journalData, entries } = adaptedCharacter;

  let actor;
  try {
    actor = await Actor.create( actorData );
  } catch ( cause ) {
    throw new SecondStepImportError( _loc( "S2F.Error.importFailed" ), { cause } );
  }

  try {
    await embedItems( actor, entries );
    const journal = journalData ? await JournalEntry.create( journalData ) : null;
    return { actor, journal };
  } catch ( cause ) {
    try {
      await actor.delete();
    } catch ( deleteError ) {
      error( "Could not roll back the actor after a failed import.", deleteError );
    }
    throw new SecondStepImportError( _loc( "S2F.Error.importFailed" ), { cause } );
  }
}
