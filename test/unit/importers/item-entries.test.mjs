import { describe, expect, it } from "vitest";
import { buildItemEntries } from "../../../module/importers/item-entries.mjs";

const EXPECTED_KINDS = [
  "namegiver",
  "discipline",
  "path",
  "questor",
  "questorDevotion",
  "talent",
  "knack",
  "skill",
  "spell",
  "equipment",
];

function resolved( name, itemType ) {
  return {
    data:         { name, type: itemType },
    resolution:   "uuid",
    secondStepId: `ED4${ name }`,
    itemType,
  };
}

function baseInput( overrides = {} ) {
  return {
    namegiver:   resolved( "Windling", "namegiver" ),
    disciplines: [ { resolved: resolved( "Wizard", "discipline" ) } ],
    paths:       [ { resolved: resolved( "Windmaster", "path" ), linkedSecondStepId: "ED4Wizard" } ],
    questor:     {
      questor:  { resolved: resolved( "Mynbruje", "questor" ), secondStepId: "ED4Mynbruje" },
      devotion: { resolved: resolved( "MynbrujeDevotion", "devotion" ), secondStepId: "ED4Mynbruje" },
    },
    talents:     [ {
      resolved:           resolved( "AstralSight", "talent" ),
      sourceSecondStepId: "ED4Wizard",
      atLevel:            1,
      isPathTalent:       false,
    } ],
    knacks:      [ { resolved: resolved( "AnimalBond", "knackAbility" ) } ],
    skills:      [ { resolved: resolved( "Accounting", "skill" ), uid: "uid-1" } ],
    spells:      [ { resolved: resolved( "CrunchClimb", "spell" ) } ],
    equipment:   [ { resolved: resolved( "Dagger", "weapon" ) } ],
    ...overrides,
  };
}

const byKind = ( entries, kind ) => entries.filter( entry => entry.kind === kind );

describe( "buildItemEntries", () => {

  it( "creates the entries in a fixed order, grouped by kind", () => {
    const entries = buildItemEntries( baseInput() );

    expect( entries.map( entry => entry.kind ) ).toEqual( EXPECTED_KINDS );
  } );

  it( "keeps the groups together if there are several items of a kind", () => {
    const entries = buildItemEntries( baseInput( {
      disciplines: [
        { resolved: resolved( "Wizard", "discipline" ) },
        { resolved: resolved( "Elementalist", "discipline" ) },
      ],
      paths:       [
        { resolved: resolved( "Windmaster", "path" ), linkedSecondStepId: "ED4Wizard" },
        { resolved: resolved( "Stormcaller", "path" ), linkedSecondStepId: "ED4Elementalist" },
      ],
      questor:     null,
      talents:     [],
      knacks:      [],
      skills:      [],
      spells:      [],
      equipment:   [],
    } ) );

    expect( entries.map( entry => entry.kind ) ).toEqual( [
      "namegiver", "discipline", "discipline", "path", "path",
    ] );
  } );

  it( "uses the resolved item of every adapted item", () => {
    const input = baseInput();
    const entries = buildItemEntries( input );

    expect( byKind( entries, "namegiver" )[ 0 ].resolved ).toBe( input.namegiver );
    expect( byKind( entries, "discipline" )[ 0 ].resolved ).toBe( input.disciplines[ 0 ].resolved );
    expect( byKind( entries, "path" )[ 0 ].resolved ).toBe( input.paths[ 0 ].resolved );
    expect( byKind( entries, "questor" )[ 0 ].resolved ).toBe( input.questor.questor.resolved );
    expect( byKind( entries, "questorDevotion" )[ 0 ].resolved ).toBe( input.questor.devotion.resolved );
    expect( byKind( entries, "talent" )[ 0 ].resolved ).toBe( input.talents[ 0 ].resolved );
    expect( byKind( entries, "knack" )[ 0 ].resolved ).toBe( input.knacks[ 0 ].resolved );
    expect( byKind( entries, "skill" )[ 0 ].resolved ).toBe( input.skills[ 0 ].resolved );
    expect( byKind( entries, "spell" )[ 0 ].resolved ).toBe( input.spells[ 0 ].resolved );
    expect( byKind( entries, "equipment" )[ 0 ].resolved ).toBe( input.equipment[ 0 ].resolved );
  } );

  it( "keeps the adapted talent and path for the linking step", () => {
    const input = baseInput();
    const entries = buildItemEntries( input );

    expect( byKind( entries, "talent" )[ 0 ].adapted ).toBe( input.talents[ 0 ] );
    expect( byKind( entries, "path" )[ 0 ].adapted ).toBe( input.paths[ 0 ] );
    expect( byKind( entries, "equipment" )[ 0 ].adapted ).toBe( input.equipment[ 0 ] );
  } );

  it( "does not attach adapted data to any other kind", () => {
    const entries = buildItemEntries( baseInput() );

    const others = entries.filter( entry => ![ "talent", "path", "equipment" ].includes( entry.kind ) );
    expect( others.length ).toBeGreaterThan( 0 );
    for ( const entry of others ) {
      expect( entry ).not.toHaveProperty( "adapted" );
    }
  } );

  it( "keeps the order of the items of the same kind", () => {
    const entries = buildItemEntries( baseInput( {
      skills: [
        { resolved: resolved( "First", "skill" ), uid: "uid-a" },
        { resolved: resolved( "Second", "skill" ), uid: "uid-b" },
        { resolved: resolved( "Third", "skill" ), uid: "uid-c" },
      ],
    } ) );

    expect( byKind( entries, "skill" ).map( entry => entry.resolved.secondStepId ) )
      .toEqual( [ "ED4First", "ED4Second", "ED4Third" ] );
  } );

  it( "leaves out the questor and its devotion if there is no questor", () => {
    const entries = buildItemEntries( baseInput( { questor: null } ) );

    expect( entries.map( entry => entry.kind ) ).not.toContain( "questor" );
    expect( entries.map( entry => entry.kind ) ).not.toContain( "questorDevotion" );
  } );

  it( "creates only the namegiver entry if there is nothing else", () => {
    const entries = buildItemEntries( {
      namegiver:   resolved( "Windling", "namegiver" ),
      disciplines: [],
      paths:       [],
      questor:     null,
      talents:     [],
      knacks:      [],
      skills:      [],
      spells:      [],
      equipment:   [],
    } );

    expect( entries.map( entry => entry.kind ) ).toEqual( [ "namegiver" ] );
  } );

  it( "does not change the data it was given", () => {
    const input = baseInput();
    const snapshot = structuredClone( input );

    buildItemEntries( input );

    expect( input ).toEqual( snapshot );
  } );

} );