import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCharacter } from "../../../module/importers/create-character.mjs";
import { SecondStepImportError } from "../../../module/importers/errors.mjs";

// The logging is not what is tested here. It is silenced, so a rollback does not print to the test output.
vi.mock( "../../../module/logging/logging.mjs" );

let actor;
let journal;

/** The documents Foundry would return for the given item data, with the IDs that were assigned in it. */
const documentsFor = data => data.map( item => ( { id: item._id, name: item.name } ) );

/** The same documents, but with other IDs than the ones that were assigned. */
const withOtherIds = documents => documents.map( ( document, index ) => ( { ...document, id: `otherId${ index }` } ) );

function fakeActor() {
  return {
    id:                      "actor1",
    // Returns one document per item, with the ID that was given in the data, like Foundry does with `keepId`.
    createEmbeddedDocuments: vi.fn( async ( type, data ) => documentsFor( data ) ),
    updateEmbeddedDocuments: vi.fn( async () => [] ),
    delete:                  vi.fn( async () => undefined ),
  };
}

function resolved( secondStepId, itemType ) {
  // The name is the Second Step ID, so the item can be found again by it in the data that was sent to Foundry.
  return {
    data:       { name: secondStepId, type: itemType, system: {} },
    resolution: "uuid",
    secondStepId,
    itemType,
  };
}

const simpleEntry = ( kind, secondStepId ) => ( { kind, resolved: resolved( secondStepId, kind ) } );

function talentEntry( secondStepId, adaptedOverrides = {} ) {
  const itemResolved = resolved( secondStepId, "talent" );
  return {
    kind:     "talent",
    resolved: itemResolved,
    adapted:  {
      resolved:           itemResolved,
      sourceSecondStepId: undefined,
      atLevel:            undefined,
      isPathTalent:       false,
      ...adaptedOverrides,
    },
  };
}

function pathEntry( secondStepId, linkedSecondStepId ) {
  const itemResolved = resolved( secondStepId, "path" );
  return {
    kind:     "path",
    resolved: itemResolved,
    adapted:  { resolved: itemResolved, linkedSecondStepId },
  };
}

function baseCharacter( overrides = {} ) {
  return {
    actorData:   { name: "Test Name", type: "character", system: {} },
    journalData: null,
    entries:     [ simpleEntry( "namegiver", "ED4Windling" ) ],
    deferred:    {},
    ...overrides,
  };
}

/** A character with a discipline, a path linked to it, and the talent of that path. */
function pathCharacter( overrides = {} ) {
  return baseCharacter( {
    entries: [
      simpleEntry( "discipline", "ED4Wizard" ),
      pathEntry( "ED4Windmaster", "ED4Wizard" ),
      talentEntry( "ED4WindTalent", { sourceSecondStepId: "ED4Windmaster", atLevel: 1, isPathTalent: true } ),
    ],
    ...overrides,
  } );
}

async function rejectionOf( promise ) {
  try {
    await promise;
  } catch ( error ) {
    return error;
  }
  throw new Error( "Expected the promise to reject, but it resolved." );
}

const sentItemData = () => actor.createEmbeddedDocuments.mock.calls[ 0 ][ 1 ];
const sentUpdates = () => actor.updateEmbeddedDocuments.mock.calls[ 0 ][ 1 ];

/** The ID that was assigned to the item with the given Second Step ID (which is also its name in these tests). */
const idOf = secondStepId => sentItemData().find( data => data.name === secondStepId )._id;

const withoutId = data => {
  const copy = { ...data };
  delete copy._id;
  return copy;
};

describe( "createCharacter", () => {

  beforeEach( () => {
    actor = fakeActor();
    journal = { id: "journal1" };
    vi.stubGlobal( "Actor", { create: vi.fn( async () => actor ) } );
    vi.stubGlobal( "JournalEntry", { create: vi.fn( async () => journal ) } );
  } );

  describe( "creating the character", () => {

    it( "creates the actor from the actor data", async () => {
      const character = baseCharacter();
      await createCharacter( character );

      expect( globalThis.Actor.create ).toHaveBeenCalledWith( character.actorData );
    } );

    it( "embeds all items in a single call, in the order of the entries, keeping the IDs it assigned", async () => {
      const character = baseCharacter( {
        entries: [ simpleEntry( "namegiver", "ED4Windling" ), simpleEntry( "skill", "ED4Accounting" ), simpleEntry( "spell", "ED4CrunchClimb" ) ],
      } );
      await createCharacter( character );

      expect( actor.createEmbeddedDocuments ).toHaveBeenCalledTimes( 1 );
      const [ type, data, options ] = actor.createEmbeddedDocuments.mock.calls[ 0 ];
      expect( type ).toBe( "Item" );
      expect( data.map( withoutId ) ).toEqual( character.entries.map( entry => entry.resolved.data ) );
      expect( options ).toEqual( { keepId: true } );
    } );

    it( "returns the actor, and no journal if the character has no log", async () => {
      const result = await createCharacter( baseCharacter( { journalData: null } ) );

      expect( result.actor ).toBe( actor );
      expect( result.journal ).toBeNull();
      expect( globalThis.JournalEntry.create ).not.toHaveBeenCalled();
    } );

    it( "creates the journal from the journal data and returns it", async () => {
      const journalData = { name: "Test Journal", pages: [] };
      const result = await createCharacter( baseCharacter( { journalData } ) );

      expect( globalThis.JournalEntry.create ).toHaveBeenCalledWith( journalData );
      expect( result.journal ).toBe( journal );
    } );

    it( "creates the journal last, after the items and their links", async () => {
      const character = baseCharacter( {
        journalData: { name: "Test Journal", pages: [] },
        entries:     [
          simpleEntry( "discipline", "ED4Wizard" ),
          talentEntry( "ED4AstralSight", { sourceSecondStepId: "ED4Wizard", atLevel: 1 } ),
        ],
      } );
      await createCharacter( character );

      const journalOrder = globalThis.JournalEntry.create.mock.invocationCallOrder[ 0 ];
      expect( actor.createEmbeddedDocuments.mock.invocationCallOrder[ 0 ] ).toBeLessThan( journalOrder );
      expect( actor.updateEmbeddedDocuments.mock.invocationCallOrder[ 0 ] ).toBeLessThan( journalOrder );
    } );

  } );

  describe( "item IDs", () => {

    it( "gives every item its own ID", async () => {
      await createCharacter( baseCharacter( {
        entries: [ simpleEntry( "namegiver", "ED4Windling" ), simpleEntry( "skill", "ED4Accounting" ), simpleEntry( "spell", "ED4CrunchClimb" ) ],
      } ) );

      const ids = sentItemData().map( data => data._id );
      expect( ids.every( id => typeof id === "string" && id.length > 0 ) ).toBe( true );
      expect( new Set( ids ).size ).toBe( ids.length );
    } );

    it( "does not reuse the ID that the data of a compendium item brings with it", async () => {
      const first = simpleEntry( "skill", "ED4Knowledge" );
      const second = simpleEntry( "skill", "ED4Knowledge" );
      first.resolved.data._id = "compendiumItem01";
      second.resolved.data._id = "compendiumItem01";

      await createCharacter( baseCharacter( { entries: [ first, second ] } ) );

      const ids = sentItemData().map( data => data._id );
      expect( ids ).not.toContain( "compendiumItem01" );
      expect( new Set( ids ).size ).toBe( 2 );
    } );

    it( "does not add the assigned IDs to the data of the entries", async () => {
      const character = baseCharacter();
      await createCharacter( character );

      expect( character.entries[ 0 ].resolved.data ).not.toHaveProperty( "_id" );
    } );

  } );

  describe( "linking", () => {

    it( "links a talent to the embedded discipline it is sourced from", async () => {
      await createCharacter( baseCharacter( {
        entries: [
          simpleEntry( "discipline", "ED4Wizard" ),
          talentEntry( "ED4AstralSight", { sourceSecondStepId: "ED4Wizard", atLevel: 2 } ),
        ],
      } ) );

      expect( actor.updateEmbeddedDocuments ).toHaveBeenCalledTimes( 1 );
      expect( actor.updateEmbeddedDocuments.mock.calls[ 0 ][ 0 ] ).toBe( "Item" );
      expect( sentUpdates() ).toEqual( [ {
        _id:                     idOf( "ED4AstralSight" ),
        "system.source.class":   idOf( "ED4Wizard" ),
        "system.source.atLevel": 2,
      } ] );
    } );

    it( "links a path to its discipline and to its path talent with a single update", async () => {
      await createCharacter( pathCharacter() );

      const updates = sentUpdates();
      expect( updates ).toHaveLength( 2 );
      expect( updates ).toEqual( expect.arrayContaining( [
        {
          _id:                     idOf( "ED4WindTalent" ),
          "system.source.class":   idOf( "ED4Windmaster" ),
          "system.source.atLevel": 1,
        },
        {
          _id:                         idOf( "ED4Windmaster" ),
          "system.pathTalentId":       idOf( "ED4WindTalent" ),
          "system.sourceDisciplineId": idOf( "ED4Wizard" ),
        },
      ] ) );
    } );

    it( "sends no more than one update per item", async () => {
      await createCharacter( pathCharacter() );

      const ids = sentUpdates().map( update => update._id );
      expect( new Set( ids ).size ).toBe( ids.length );
    } );

    it( "links the questor to its devotion", async () => {
      await createCharacter( baseCharacter( {
        entries: [ simpleEntry( "questor", "ED4Mynbruje" ), simpleEntry( "questorDevotion", "ED4MynbrujeDevotion" ) ],
      } ) );

      expect( sentUpdates() ).toEqual( [ {
        _id:                        idOf( "ED4Mynbruje" ),
        "system.questorDevotionId": idOf( "ED4MynbrujeDevotion" ),
      } ] );
    } );

    it( "does not link the questor if there is no devotion entry", async () => {
      await createCharacter( baseCharacter( { entries: [ simpleEntry( "questor", "ED4Mynbruje" ) ] } ) );

      expect( actor.updateEmbeddedDocuments ).not.toHaveBeenCalled();
    } );

    it( "sends no update at all if there is nothing to link", async () => {
      await createCharacter( baseCharacter( {
        entries: [ simpleEntry( "namegiver", "ED4Windling" ), simpleEntry( "skill", "ED4Accounting" ) ],
      } ) );

      expect( actor.updateEmbeddedDocuments ).not.toHaveBeenCalled();
    } );

    it( "does not depend on the order in which Foundry returns the created documents", async () => {
      // Foundry does not guarantee that a batch creation returns the documents in the order of the data.
      actor.createEmbeddedDocuments.mockImplementation( async ( type, data ) => documentsFor( data ).reverse() );

      await createCharacter( pathCharacter() );

      expect( sentUpdates() ).toEqual( expect.arrayContaining( [
        {
          _id:                     idOf( "ED4WindTalent" ),
          "system.source.class":   idOf( "ED4Windmaster" ),
          "system.source.atLevel": 1,
        },
        {
          _id:                         idOf( "ED4Windmaster" ),
          "system.pathTalentId":       idOf( "ED4WindTalent" ),
          "system.sourceDisciplineId": idOf( "ED4Wizard" ),
        },
      ] ) );
    } );

  } );

  describe( "permissions", () => {

    it( "refuses before creating anything if the user may not create actors", async () => {
      globalThis.game.user.can.mockImplementation( permission => permission !== "ACTOR_CREATE" );

      const failure = await rejectionOf( createCharacter( baseCharacter() ) );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( globalThis.Actor.create ).not.toHaveBeenCalled();
    } );

    it( "refuses before creating anything if there is a log but the user may not create journals", async () => {
      globalThis.game.user.can.mockImplementation( permission => permission !== "JOURNAL_CREATE" );

      const failure = await rejectionOf(
        createCharacter( baseCharacter( { journalData: { name: "Test Journal", pages: [] } } ) ),
      );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( globalThis.Actor.create ).not.toHaveBeenCalled();
      expect( actor.delete ).not.toHaveBeenCalled();
    } );

    it( "does not need the permission to create journals if there is no log", async () => {
      globalThis.game.user.can.mockImplementation( permission => permission !== "JOURNAL_CREATE" );

      const result = await createCharacter( baseCharacter( { journalData: null } ) );

      expect( result.actor ).toBe( actor );
    } );

  } );

  describe( "rollback", () => {

    it( "does not delete anything if the actor cannot be created", async () => {
      const error = new Error( "no actor" );
      globalThis.Actor.create.mockRejectedValue( error );

      const failure = await rejectionOf( createCharacter( baseCharacter( { journalData: { name: "J", pages: [] } } ) ) );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( failure.cause ).toBe( error );
      expect( actor.delete ).not.toHaveBeenCalled();
      expect( actor.createEmbeddedDocuments ).not.toHaveBeenCalled();
      expect( globalThis.JournalEntry.create ).not.toHaveBeenCalled();
    } );

    it( "deletes the actor and throws if the items cannot be created", async () => {
      const error = new Error( "invalid item" );
      actor.createEmbeddedDocuments.mockRejectedValue( error );

      const failure = await rejectionOf( createCharacter( baseCharacter() ) );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( failure.cause ).toBe( error );
      expect( actor.delete ).toHaveBeenCalledTimes( 1 );
    } );

    it( "deletes the actor and names the item if a document is missing from the result", async () => {
      actor.createEmbeddedDocuments.mockImplementation( async ( type, data ) => documentsFor( data ).slice( 0, -1 ) );
      const character = baseCharacter( {
        entries: [ simpleEntry( "namegiver", "ED4Windling" ), simpleEntry( "skill", "ED4Accounting" ) ],
      } );

      const failure = await rejectionOf( createCharacter( character ) );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( failure.cause.message ).toContain( "ED4Accounting" );
      expect( failure.cause.message ).not.toContain( "ED4Windling" );
      expect( actor.delete ).toHaveBeenCalledTimes( 1 );
    } );

    it( "does not link anything if a document is missing from the result", async () => {
      actor.createEmbeddedDocuments.mockImplementation( async ( type, data ) => documentsFor( data ).slice( 1 ) );

      await rejectionOf( createCharacter( pathCharacter() ) );

      expect( actor.updateEmbeddedDocuments ).not.toHaveBeenCalled();
    } );

    it( "deletes the actor if Foundry does not keep the IDs that were assigned", async () => {
      actor.createEmbeddedDocuments.mockImplementation( async ( type, data ) => withOtherIds( documentsFor( data ) ) );

      const failure = await rejectionOf( createCharacter( pathCharacter() ) );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( actor.delete ).toHaveBeenCalledTimes( 1 );
      expect( actor.updateEmbeddedDocuments ).not.toHaveBeenCalled();
    } );

    it( "deletes the actor if linking the items fails", async () => {
      const error = new Error( "update failed" );
      actor.updateEmbeddedDocuments.mockRejectedValue( error );

      const failure = await rejectionOf( createCharacter( baseCharacter( {
        entries: [
          simpleEntry( "discipline", "ED4Wizard" ),
          talentEntry( "ED4AstralSight", { sourceSecondStepId: "ED4Wizard", atLevel: 1 } ),
        ],
      } ) ) );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( failure.cause ).toBe( error );
      expect( actor.delete ).toHaveBeenCalledTimes( 1 );
    } );

    it( "deletes the actor if the journal cannot be created", async () => {
      const error = new Error( "journal vetoed" );
      globalThis.JournalEntry.create.mockRejectedValue( error );

      const failure = await rejectionOf(
        createCharacter( baseCharacter( { journalData: { name: "Test Journal", pages: [] } } ) ),
      );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( failure.cause ).toBe( error );
      expect( actor.delete ).toHaveBeenCalledTimes( 1 );
    } );

    it( "does not try to create the journal if the items failed", async () => {
      actor.createEmbeddedDocuments.mockRejectedValue( new Error( "invalid item" ) );

      await rejectionOf( createCharacter( baseCharacter( { journalData: { name: "Test Journal", pages: [] } } ) ) );

      expect( globalThis.JournalEntry.create ).not.toHaveBeenCalled();
    } );

    it( "still throws the original error if deleting the actor fails as well", async () => {
      const error = new Error( "invalid item" );
      actor.createEmbeddedDocuments.mockRejectedValue( error );
      actor.delete.mockRejectedValue( new Error( "cannot delete" ) );

      const failure = await rejectionOf( createCharacter( baseCharacter() ) );

      expect( failure ).toBeInstanceOf( SecondStepImportError );
      expect( failure.cause ).toBe( error );
    } );

    it( "does not roll back if everything worked", async () => {
      await createCharacter( baseCharacter( { journalData: { name: "Test Journal", pages: [] } } ) );

      expect( actor.delete ).not.toHaveBeenCalled();
    } );

  } );

} );