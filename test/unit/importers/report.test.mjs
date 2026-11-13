import { describe, expect, it } from "vitest";
import { MODULE_ID } from "../../../module/constants/constants.mjs";
import { buildImportReport } from "../../../module/importers/report.mjs";

function entry( {
  kind = "skill",
  name = "Test Item",
  secondStepId = "ED4TestItem",
  itemType = "skill",
  resolution = "uuid",
  unresolved = false,
} = {} ) {
  return {
    kind,
    resolved: {
      data: {
        name,
        type: itemType,
        ...( unresolved ? { flags: { [ MODULE_ID ]: { unresolved: true } } } : {} ),
      },
      resolution,
      secondStepId,
      itemType,
    },
  };
}

function baseCharacter( overrides = {} ) {
  return {
    actorData:   { name: "Test Name" },
    journalData: null,
    entries:     [],
    deferred:    {},
    ...overrides,
  };
}

describe( "buildImportReport", () => {

  it( "names the character", () => {
    expect( buildImportReport( baseCharacter() ).characterName ).toBe( "Test Name" );
  } );

  it( "counts the items to be created", () => {
    const report = buildImportReport( baseCharacter( { entries: [ entry(), entry(), entry() ] } ) );

    expect( report.itemCount ).toBe( 3 );
  } );

  describe( "resolutions", () => {

    it( "counts the items by the way they were resolved", () => {
      const report = buildImportReport( baseCharacter( {
        entries: [
          entry( { resolution: "uuid" } ),
          entry( { resolution: "uuid" } ),
          entry( { resolution: "edid" } ),
          entry( { resolution: "synthesized", unresolved: true } ),
        ],
      } ) );

      expect( report.resolutions ).toEqual( { uuid: 2, edid: 1, synthesized: 1 } );
    } );

    it( "reports zero for every way if there are no items", () => {
      expect( buildImportReport( baseCharacter() ).resolutions ).toEqual( { uuid: 0, edid: 0, synthesized: 0 } );
    } );

  } );

  describe( "unresolved items", () => {

    it( "lists the flagged items with what the GM needs to find them", () => {
      const report = buildImportReport( baseCharacter( {
        entries: [
          entry( { kind: "talent", name: "Fireblood", secondStepId: "ED4Fireblood", itemType: "talent", resolution: "synthesized", unresolved: true } ),
        ],
      } ) );

      expect( report.unresolved ).toEqual( [
        { kind: "talent", name: "Fireblood", itemType: "talent", secondStepId: "ED4Fireblood" },
      ] );
    } );

    it( "keeps the order of the entries", () => {
      const report = buildImportReport( baseCharacter( {
        entries: [
          entry( { secondStepId: "ED4First", resolution: "synthesized", unresolved: true } ),
          entry( { secondStepId: "ED4Resolved" } ),
          entry( { secondStepId: "ED4Second", resolution: "synthesized", unresolved: true } ),
        ],
      } ) );

      expect( report.unresolved.map( item => item.secondStepId ) ).toEqual( [ "ED4First", "ED4Second" ] );
    } );

    it( "does not list items that were synthesized on purpose, like coins", () => {
      const report = buildImportReport( baseCharacter( {
        entries: [
          entry( { kind: "equipment", itemType: "equipment", resolution: "synthesized", unresolved: false } ),
        ],
      } ) );

      expect( report.unresolved ).toEqual( [] );
      expect( report.resolutions.synthesized ).toBe( 1 );
    } );

    it( "is empty if everything was resolved", () => {
      const report = buildImportReport( baseCharacter( { entries: [ entry(), entry( { resolution: "edid" } ) ] } ) );

      expect( report.unresolved ).toEqual( [] );
    } );

  } );

  describe( "deferred sections", () => {

    it( "lists the sections that were not imported, with their counts, in the given order", () => {
      const report = buildImportReport( baseCharacter( {
        deferred: { threadItems: 3, matrixGrants: 0, knacks: 2, legendPoints: 1200 },
      } ) );

      expect( report.deferred ).toEqual( [
        { section: "threadItems", count: 3 },
        { section: "knacks", count: 2 },
        { section: "legendPoints", count: 1200 },
      ] );
    } );

    it( "is empty if there is nothing that was not imported", () => {
      const report = buildImportReport( baseCharacter( { deferred: { threadItems: 0, knacks: 0 } } ) );

      expect( report.deferred ).toEqual( [] );
    } );

  } );

  it( "does not change the data it was given", () => {
    const character = baseCharacter( {
      entries:  [ entry( { resolution: "synthesized", unresolved: true } ) ],
      deferred: { threadItems: 1 },
    } );
    const snapshot = structuredClone( character );

    buildImportReport( character );

    expect( character ).toEqual( snapshot );
  } );

} );