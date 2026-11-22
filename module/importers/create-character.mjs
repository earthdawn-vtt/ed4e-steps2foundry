/**
 * @import * from "../_types.mjs";
 */

import { SecondStepImportError } from "./errors.mjs";
import {
  linkMatrixSpells,
  linkPathDisciplines,
  linkQuestorDevotion,
  linkTalentSources,
  mergeLinkUpdates,
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
 * Makes sure that every item was created with the ID that was assigned to it.
 * @param {{ id: string, entry: ItemEntry }[]} embedded - The entries with their assigned IDs.
 * @param {Item[]} created - The documents Foundry returned. Only their IDs are used, never their order.
 * @throws {Error} If an item is missing from the returned documents.
 */
function assertAllCreated( embedded, created ) {
  const createdIds = new Set( created.map( document => document.id ) );
  const missing = embedded.filter( ( { id } ) => !createdIds.has( id ) );
  if ( missing.length === 0 ) return;

  const names = missing.map( ( { entry } ) => `${ entry.resolved.data.name } (${ entry.resolved.secondStepId })` );
  throw new SecondStepImportError(
    `${ missing.length } of ${ embedded.length } items were not created with their assigned ID: ${ names.join( ", " ) }`
  );
}

/**
 * Creates the items of one phase, with assigned IDs, and checks that all of them were created.
 * @param {Actor} actor - The created actor.
 * @param {ItemEntry[]} entries - The item entries to create.
 * @returns {Promise<{ id: string, entry: ItemEntry }[]>} The entries with their assigned IDs.
 * @throws {SecondStepImportError} If an item was not created with the ID that was assigned to it.
 */
async function createItems( actor, entries ) {
  const embedded = entries.map( entry => ( { id: foundry.utils.randomID(), entry } ) );

  // `_id` is always overwritten: the data of a compendium item brings the `_id` of that compendium item with it,
  // and several entries (like three Knowledge skills) can come from the same one.
  const itemData = embedded.map( ( { id, entry } ) => ( { ...entry.resolved.data, _id: id } ) );
  const created = await actor.createEmbeddedDocuments( "Item", itemData, { keepId: true } );
  assertAllCreated( embedded, created );

  return embedded;
}

/**
 * Whether the entry resolved to a spell knack, which copies data from its source spell when created.
 * @param {ItemEntry} entry
 * @returns {boolean}
 */
const isSpellKnack = entry => entry.resolved.itemType === "spellKnack";

/**
 * Embeds all items in the actor and links them to each other.
 *
 * The documents that Foundry returns from a batch creation are not guaranteed to be in the order of the data that was
 * passed in, so that order is never used to match documents to entries. Instead, every item gets its own ID up front
 * and is created with `keepId`, which means the ID of every entry is known before anything is created.
 *
 * Items are created in two phases: spell knacks go second, because they copy data from their source spell, which
 * has to be on the actor already.
 * @param {Actor} actor - The created actor.
 * @param {ItemEntry[]} entries - The item entries to embed.
 * @throws {SecondStepImportError} If an item was not created with the ID that was assigned to it.
 */
async function embedItems( actor, entries ) {
  const phase1 = await createItems( actor, entries.filter( entry => !isSpellKnack( entry ) ) );
  const spellKnackEntries = entries.filter( isSpellKnack );
  const phase2 = spellKnackEntries.length > 0 ? await createItems( actor, spellKnackEntries ) : [];
  const embedded = [ ...phase1, ...phase2 ];

  const ofKind = kind => embedded.filter( ( { entry } ) => entry.kind === kind );

  const sourceableItems = [ ...ofKind( "discipline" ), ...ofKind( "path" ) ].map(
    ( { id, entry } ) => ( { id, secondStepId: entry.resolved.secondStepId } )
  );
  const embeddedTalents = ofKind( "talent" ).map( ( { id, entry } ) => ( { id, adapted: entry.adapted } ) );
  const embeddedPaths = ofKind( "path" ).map( ( { id, entry } ) => ( { id, adapted: entry.adapted } ) );

  const { talentUpdates, pathUpdates } = linkTalentSources( embeddedTalents, sourceableItems );
  const pathDisciplineUpdates = linkPathDisciplines( embeddedPaths, sourceableItems );

  const questor = ofKind( "questor" )[ 0 ];
  const devotion = ofKind( "questorDevotion" )[ 0 ];
  const questorUpdates = questor && devotion ? [ linkQuestorDevotion( questor.id, devotion.id ) ] : [];

  const embeddedMatrices = [ ...ofKind( "talent" ), ...ofKind( "equipment" ) ]
    .filter( ( { entry } ) => entry.adapted?.matrixSpellSecondStepId )
    .map( ( { id, entry } ) => ( { id, matrixSpellSecondStepId: entry.adapted.matrixSpellSecondStepId } ) );
  const embeddedSpells = ofKind( "spell" ).map(
    ( { id, entry } ) => ( { id, secondStepId: entry.resolved.secondStepId } )
  );
  const matrixUpdates = linkMatrixSpells( embeddedMatrices, embeddedSpells );

  const updates = mergeLinkUpdates( [
    ...talentUpdates,
    ...pathUpdates,
    ...pathDisciplineUpdates,
    ...questorUpdates,
    ...matrixUpdates,
  ] ).map( ( { itemId, updateData } ) => ( { _id: itemId, ...updateData } ) );

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
