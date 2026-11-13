import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCharacter } from "../../../module/importers/create-character.mjs";
import { SecondStepImportError } from "../../../module/importers/errors.mjs";

// The logging is not what is tested here. It is silenced, so a rollback does not print to the test output.
vi.mock( "../../../module/logging/logging.mjs" );

let actor;
let journal;

function fakeActor() {
  return {
    id:                      "actor1",
    // Returns one document per item, with the ids item0, item1, ... in the order of the data.
    createEmbeddedDocuments: vi.fn( async ( type, data ) => data.map( ( item, index ) => ( { id: `item${ index }`, name: item.name } ) ) ),
    updateEmbeddedDocuments: vi.fn( async () => [] ),
    delete:                  vi.fn( async () => undefined ),
  };
}

function resolved( secondStepId, itemType ) {
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

async function rejectionOf( promise ) {
  try {
    await promise;
  } catch ( error ) {
    return error;
  }
  throw new Error( "Expected the promise to reject, but it resolved." );
}

const sentUpdates = () => actor.updateEmbeddedDocuments.mock.calls[ 0 ][ 1 ];

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

    it( "embeds all items in a single call, in the order of the entries", async () => {
      const character = baseCharacter( {
        entries: [ simpleEntry( "namegiver", "ED4Windling" ), simpleEntry( "skill", "ED4Accounting" ), simpleEntry( "spell", "ED4CrunchClimb" ) ],
      } );
      await createCharacter( character );

      expect( actor.createEmbeddedDocuments ).toHaveBeenCalledTimes( 1 );
      expect( actor.createEmbeddedDocuments ).toHaveBeenCalledWith(
        "Item",
        character.entries.map( entry => entry.resolved.data ),
      );
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
      expect( sentUpdates() ).toEqual( [
        { _id: "item1", "system.source.class": "item0", "system.source.atLevel": 2 },
      ] );
    } );

    it( "links a path to its discipline and to its path talent with a single update", async () => {
      await createCharacter( baseCharacter( {
        entries: [
          simpleEntry( "discipline", "ED4Wizard" ),
          pathEntry( "ED4Windmaster", "ED4Wizard" ),
          talentEntry( "ED4WindTalent", { sourceSecondStepId: "ED4Windmaster", atLevel: 1, isPathTalent: true } ),
        ],
      } ) );

      const updates = sentUpdates();
      expect( updates ).toHaveLength( 2 );
      expect( updates ).toEqual( expect.arrayContaining( [
        { _id: "item2", "system.source.class": "item1", "system.source.atLevel": 1 },
        { _id: "item1", "system.pathTalentId": "item2", "system.sourceDisciplineId": "item0" },
      ] ) );
    } );

    it( "sends no more than one update per item", async () => {
      await createCharacter( baseCharacter( {
        entries: [
          simpleEntry( "discipline", "ED4Wizard" ),
          pathEntry( "ED4Windmaster", "ED4Wizard" ),
          talentEntry( "ED4WindTalent", { sourceSecondStepId: "ED4Windmaster", atLevel: 1, isPathTalent: true } ),
        ],
      } ) );

      const ids = sentUpdates().map( update => update._id );
      expect( new Set( ids ).size ).toBe( ids.length );
    } );

    it( "links the questor to its devotion", async () => {
      await createCharacter( baseCharacter( {
        entries: [ simpleEntry( "questor", "ED4Mynbruje" ), simpleEntry( "questorDevotion", "ED4Mynbruje" ) ],
      } ) );

      expect( sentUpdates() ).toEqual( [ { _id: "item0", "system.questorDevotionId": "item1" } ] );
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