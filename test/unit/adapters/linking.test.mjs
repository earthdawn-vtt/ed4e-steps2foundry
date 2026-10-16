import { describe, expect, it, vi } from "vitest";
import { linkQuestorDevotion, linkTalentSources, zipCreatedWithAdapted } from "../../../module/adapters/linking.mjs";

function adaptedTalent( overrides = {} ) {
  return {
    sourceSecondStepId: "ED4Wizard",
    atLevel:            3,
    isPathTalent:       false,
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

describe( "zipCreatedWithAdapted", () => {

  it( "zips created documents with the adapted data they came from, by position", () => {
    const created = [ { id: "a" }, { id: "b" } ];
    const adaptedData = [ { foo: 1 }, { foo: 2 } ];

    expect( zipCreatedWithAdapted( created, adaptedData ) ).toEqual( [
      { id: "a", adapted: { foo: 1 } },
      { id: "b", adapted: { foo: 2 } },
    ] );
  } );

  it( "throws on length mismatch", () => {
    expect( () => zipCreatedWithAdapted( [ { id: "a" } ], [] ) ).toThrow();
  } );

} );