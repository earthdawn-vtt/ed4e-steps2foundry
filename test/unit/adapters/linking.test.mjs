import { describe, expect, it, vi } from "vitest";
import {
  linkMatrixSpells,
  linkPathDisciplines,
  linkQuestorDevotion,
  linkTalentSources,
  mergeLinkUpdates,
} from "../../../module/adapters/linking.mjs";

function adaptedTalent( overrides = {} ) {
  return {
    sourceSecondStepId: "ED4Wizard",
    atLevel:            3,
    isPathTalent:       false,
    ...overrides,
  };
}

function adaptedPath( overrides = {} ) {
  return {
    linkedSecondStepId: "ED4Wizard",
    ...overrides,
  };
}

describe( "linkTalentSources", () => {

  it( "patches system.source.class and atLevel for a discipline-sourced talent", () => {
    const embeddedTalents = [ { id: "talent1", adapted: adaptedTalent() } ];
    const sourceableItems = [ { id: "discipline1", secondStepId: "ED4Wizard" } ];

    const { talentUpdates, pathUpdates } = linkTalentSources( embeddedTalents, sourceableItems );

    expect( talentUpdates ).toEqual( [ {
      itemId:     "talent1",
      updateData: { "system.source.class": "discipline1", "system.source.atLevel": 3 },
    } ] );
    expect( pathUpdates ).toHaveLength( 0 );
  } );

  it( "omits system.source.atLevel when the adapted talent has no atLevel", () => {
    const embeddedTalents = [ { id: "talent1", adapted: adaptedTalent( { atLevel: undefined } ) } ];
    const sourceableItems = [ { id: "discipline1", secondStepId: "ED4Wizard" } ];

    const { talentUpdates } = linkTalentSources( embeddedTalents, sourceableItems );

    expect( talentUpdates[ 0 ].updateData ).toEqual( { "system.source.class": "discipline1" } );
  } );

  it( "links a path talent to its path and sets system.pathTalentId on the path", () => {
    const embeddedTalents = [ { id:      "talent1", adapted: adaptedTalent( {
      sourceSecondStepId: "ED4Windmaster", atLevel: undefined, isPathTalent: true,
    } ) } ];
    const sourceableItems = [ { id: "path1", secondStepId: "ED4Windmaster" } ];

    const { talentUpdates, pathUpdates } = linkTalentSources( embeddedTalents, sourceableItems );

    expect( talentUpdates[ 0 ] ).toEqual( {
      itemId:     "talent1",
      updateData: { "system.source.class": "path1" },
    } );
    expect( pathUpdates ).toEqual( [ {
      itemId:     "path1",
      updateData: { "system.pathTalentId": "talent1" },
    } ] );
  } );

  it( "links a pathGrantedTalent to its path without producing a pathUpdate", () => {
    const embeddedTalents = [ { id:      "talent1", adapted: adaptedTalent( {
      sourceSecondStepId: "ED4Windmaster", atLevel: 4, isPathTalent: false,
    } ) } ];
    const sourceableItems = [ { id: "path1", secondStepId: "ED4Windmaster" } ];

    const { talentUpdates, pathUpdates } = linkTalentSources( embeddedTalents, sourceableItems );

    expect( talentUpdates[ 0 ].updateData ).toEqual( { "system.source.class": "path1", "system.source.atLevel": 4 } );
    expect( pathUpdates ).toHaveLength( 0 );
  } );

  it( "leaves talents with no resolvable source untouched (namegiver/effectRaisable)", () => {
    const embeddedTalents = [ { id: "talent1", adapted: adaptedTalent( { sourceSecondStepId: undefined } ) } ];

    const { talentUpdates, pathUpdates } = linkTalentSources( embeddedTalents, [] );

    expect( talentUpdates ).toHaveLength( 0 );
    expect( pathUpdates ).toHaveLength( 0 );
  } );

  it( "warns and skips a talent whose source has no matching embedded item", () => {
    const warnSpy = vi.spyOn( console, "warn" ).mockImplementation( () => {} );
    const embeddedTalents = [
      { id: "talent1", adapted: adaptedTalent( { sourceSecondStepId: "ED4Unknown" } ) }
    ];

    const { talentUpdates, pathUpdates } = linkTalentSources(
      embeddedTalents,
      [],
    );

    expect( talentUpdates ).toHaveLength( 0 );
    expect( pathUpdates ).toHaveLength( 0 );
    expect( warnSpy ).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  } );

} );

describe( "linkQuestorDevotion", () => {
  it( "links the questor to the given questor devotion id", () => {
    const update = linkQuestorDevotion( "questor1", "devotion1" );

    expect( update ).toEqual( {
      itemId:     "questor1",
      updateData: { "system.questorDevotionId": "devotion1" },
    } );
  } );
} );

describe( "linkPathDisciplines", () => {

  const discipline = ( id, secondStepId ) => ( { id, secondStepId } );
  const embeddedPath = ( id, linkedSecondStepId ) => ( { id, adapted: adaptedPath( { linkedSecondStepId } ) } );

  it( "links a path to the embedded discipline it belongs to", () => {
    const updates = linkPathDisciplines(
      [ embeddedPath( "path1", "ED4Wizard" ) ],
      [ discipline( "disc1", "ED4Wizard" ), discipline( "disc2", "ED4Elementalist" ) ],
    );

    expect( updates ).toEqual( [
      { itemId: "path1", updateData: { "system.sourceDisciplineId": "disc1" } },
    ] );
  } );

  it( "links every path to its own discipline", () => {
    const updates = linkPathDisciplines(
      [ embeddedPath( "path1", "ED4Wizard" ), embeddedPath( "path2", "ED4Elementalist" ) ],
      [ discipline( "disc1", "ED4Wizard" ), discipline( "disc2", "ED4Elementalist" ) ],
    );

    expect( updates ).toEqual( [
      { itemId: "path1", updateData: { "system.sourceDisciplineId": "disc1" } },
      { itemId: "path2", updateData: { "system.sourceDisciplineId": "disc2" } },
    ] );
  } );

  it( "skips a path whose discipline is not embedded and warns about it", () => {
    const warn = vi.spyOn( console, "warn" ).mockImplementation( () => {} );
    const updates = linkPathDisciplines(
      [ embeddedPath( "path1", "ED4Missing" ), embeddedPath( "path2", "ED4Wizard" ) ],
      [ discipline( "disc1", "ED4Wizard" ) ],
    );

    expect( updates ).toEqual( [
      { itemId: "path2", updateData: { "system.sourceDisciplineId": "disc1" } },
    ] );
    expect( warn ).toHaveBeenCalledOnce();
    warn.mockRestore();
  } );

  it( "returns no updates if there are no paths", () => {
    expect( linkPathDisciplines( [], [ discipline( "disc1", "ED4Wizard" ) ] ) ).toEqual( [] );
  } );

} );

describe( "linkMatrixSpells", () => {

  const spell = ( id, secondStepId ) => ( { id, secondStepId } );
  const matrix = ( id, matrixSpellSecondStepId ) => ( { id, matrixSpellSecondStepId } );

  it( "attunes the spell to the matrix", () => {
    const updates = linkMatrixSpells(
      [ matrix( "talent1", "ED4WCatchSpell" ) ],
      [ spell( "spell1", "ED4WCatchSpell" ) ],
    );

    expect( updates ).toEqual( [ { itemId: "talent1", updateData: { "system.matrix.spells": [ "spell1" ] } } ] );
  } );

  it( "attunes the right spell to every matrix", () => {
    const updates = linkMatrixSpells(
      [ matrix( "talent1", "ED4WCatchSpell" ), matrix( "item1", "ED4ECloudSummon" ) ],
      [ spell( "spell1", "ED4WCatchSpell" ), spell( "spell2", "ED4ECloudSummon" ) ],
    );

    expect( updates ).toEqual( [
      { itemId: "talent1", updateData: { "system.matrix.spells": [ "spell1" ] } },
      { itemId: "item1", updateData: { "system.matrix.spells": [ "spell2" ] } },
    ] );
  } );

  it( "attunes the same spell to several matrices", () => {
    const updates = linkMatrixSpells(
      [ matrix( "talent1", "ED4WCatchSpell" ), matrix( "talent2", "ED4WCatchSpell" ) ],
      [ spell( "spell1", "ED4WCatchSpell" ) ],
    );

    expect( updates.map( update => update.itemId ) ).toEqual( [ "talent1", "talent2" ] );
    expect( updates.every( update => update.updateData[ "system.matrix.spells" ][ 0 ] === "spell1" ) ).toBe( true );
  } );

  it( "does not create an update for a matrix without a spell", () => {
    expect( linkMatrixSpells( [ matrix( "talent1", undefined ) ], [ spell( "spell1", "ED4WCatchSpell" ) ] ) )
      .toEqual( [] );
  } );

  it( "skips a matrix whose spell is not embedded, and warns about both IDs", () => {
    const warn = vi.spyOn( console, "warn" ).mockImplementation( () => {} );

    const updates = linkMatrixSpells(
      [ matrix( "talent1", "ED4Missing" ), matrix( "talent2", "ED4WCatchSpell" ) ],
      [ spell( "spell1", "ED4WCatchSpell" ) ],
    );

    expect( updates ).toEqual( [ { itemId: "talent2", updateData: { "system.matrix.spells": [ "spell1" ] } } ] );
    expect( warn ).toHaveBeenCalledTimes( 1 );
    expect( warn.mock.calls[ 0 ][ 0 ] ).toContain( "talent1" );
    expect( warn.mock.calls[ 0 ][ 0 ] ).toContain( "ED4Missing" );
  } );

  it( "returns no updates if there are no matrices", () => {
    expect( linkMatrixSpells( [], [ spell( "spell1", "ED4WCatchSpell" ) ] ) ).toEqual( [] );
  } );

  it( "does not change the data it was given", () => {
    const matrices = [ matrix( "talent1", "ED4WCatchSpell" ) ];
    const spells = [ spell( "spell1", "ED4WCatchSpell" ) ];
    const snapshot = structuredClone( { matrices, spells } );

    linkMatrixSpells( matrices, spells );

    expect( { matrices, spells } ).toEqual( snapshot );
  } );

} );

describe( "mergeLinkUpdates", () => {

  it( "merges the updates of the same item into one", () => {
    const merged = mergeLinkUpdates( [
      { itemId: "path1", updateData: { "system.pathTalentId": "talent1" } },
      { itemId: "path1", updateData: { "system.sourceDisciplineId": "disc1" } },
    ] );

    expect( merged ).toEqual( [
      {
        itemId:     "path1",
        updateData: { "system.pathTalentId": "talent1", "system.sourceDisciplineId": "disc1" },
      },
    ] );
  } );

  it( "keeps the updates of different items separate, in the order they first appear", () => {
    const merged = mergeLinkUpdates( [
      { itemId: "path2", updateData: { "system.a": 1 } },
      { itemId: "path1", updateData: { "system.b": 2 } },
      { itemId: "path2", updateData: { "system.c": 3 } },
    ] );

    expect( merged ).toEqual( [
      { itemId: "path2", updateData: { "system.a": 1, "system.c": 3 } },
      { itemId: "path1", updateData: { "system.b": 2 } },
    ] );
  } );

  it( "lets a later value win if two updates set the same key", () => {
    const merged = mergeLinkUpdates( [
      { itemId: "path1", updateData: { "system.level": 1 } },
      { itemId: "path1", updateData: { "system.level": 2 } },
    ] );

    expect( merged[ 0 ].updateData[ "system.level" ] ).toBe( 2 );
  } );

  it( "does not change the updates it was given", () => {
    const updates = [
      { itemId: "path1", updateData: { "system.a": 1 } },
      { itemId: "path1", updateData: { "system.b": 2 } },
    ];
    const snapshot = structuredClone( updates );

    mergeLinkUpdates( updates );

    expect( updates ).toEqual( snapshot );
  } );

  it( "returns an empty list if there are no updates", () => {
    expect( mergeLinkUpdates( [] ) ).toEqual( [] );
  } );

} );