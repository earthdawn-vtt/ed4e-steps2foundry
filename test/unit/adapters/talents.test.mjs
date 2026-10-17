import { describe, expect, it } from "vitest";
import { mockLookupTable } from "../../mocks/browser.mjs";
import { mockUuidDocument } from "../../mocks/foundry.mjs";
import { adaptTalents } from "../../../module/adapters/talents.mjs";
import { idSource } from "../../helpers/factories.mjs";

function baseTalent( overrides = {} ) {
  return {
    id:            idSource( "ED4TestTalent" ),
    rank:          5,
    type:          "discipline",
    source:        idSource( "ED4Wizard" ),
    disciplineIds: [ idSource( "ED4Wizard" ) ],
    circles:       [ 3 ],
    ...overrides,
  };
}

function mockTalentResolvable( secondStepId = "ED4TestTalent" ) {
  mockLookupTable( { [ secondStepId ]: { uuid: "Compendium.pack.talent.Item.123" } } );
  mockUuidDocument( { type: "talent", toObject: () => ( { name: "Talent", type: "talent", system: {} } ) } );
}

describe( "adaptTalents", () => {

  it( "sets level and talent category according to the current source discipline", async () => {
    mockTalentResolvable();
    const { talents } = await adaptTalents( [ baseTalent() ] );

    const adaptedTalent = talents[ 0 ];
    expect( adaptedTalent.resolved.data.system.level ).toBe( 5 );
    expect( adaptedTalent.resolved.data.system.talentCategory ).toBe( "discipline" );
    expect( adaptedTalent.sourceSecondStepId ).toBe( "ED4Wizard" );
    expect( adaptedTalent.atLevel ).toBe( 3 );
  } );

  it( "leaves atLevel undefined when the source is not among the talent's listed disciplines (e.g. a namegiver)", async () => {
    mockTalentResolvable();
    const talent = baseTalent( {
      type:          "pathTalent",
      source:        undefined,
      disciplineIds: [],
      circles:       [],
      path:          idSource( "ED4Windmaster" ),
    } );
    const { talents } = await adaptTalents( [ talent ] );

    const adaptedTalent = talents[ 0 ];
    expect( adaptedTalent.sourceSecondStepId ).toBe( "ED4Windmaster" );
    expect( adaptedTalent.atLevel ).toBeUndefined();
    expect( adaptedTalent.isPathTalent ).toBe( true );
    expect( adaptedTalent.resolved.data.system.talentCategory ).toBe( "other" );
  } );

  it( "leaves atLevel and source undefined if the talent's source is a namegiver", async () => {
    mockTalentResolvable();
    const talent = baseTalent( {
      source:           idSource( "ED4Wizard" ),
      sources: [ { type: "race", id: idSource( "ED4Wizard" ) } , ],
    } );
    const { talents } = await adaptTalents( [ talent ] );

    const adaptedTalent = talents[ 0 ];
    expect( adaptedTalent.sourceSecondStepId ).toBeUndefined();
    expect( adaptedTalent.atLevel ).toBeUndefined();
    expect( adaptedTalent.isPathTalent ).toBeFalsy();
    expect( adaptedTalent.resolved.data.system.talentCategory ).toBe( "other" );
  } );

  it( "sources a pathGrantedTalent from its path, with atLevel set to the path rank", async () => {
    mockTalentResolvable();
    const talent = baseTalent( {
      type:          "pathGrantedTalent",
      source:        undefined,
      disciplineIds: [],
      circles:       [],
      path:          idSource( "ED4Windmaster" ),
      pathRank:      4,
    } );
    const { talents } = await adaptTalents( [ talent ] );

    const adaptedTalent = talents[ 0 ];
    expect( adaptedTalent.sourceSecondStepId ).toBe( "ED4Windmaster" );
    expect( adaptedTalent.atLevel ).toBe( 4 );
    expect( adaptedTalent.isPathTalent ).toBe( false );
    expect( adaptedTalent.resolved.data.system.talentCategory ).toBe( "other" );
  } );

  it( "leaves an effectRaisable talent without any source linkage", async () => {
    mockTalentResolvable();
    const talent = baseTalent( {
      type:          "effectRaisable",
      source:        idSource( "1495f853-87d4-42b5-a0de-932d20f4272a" ),
      disciplineIds: [],
      circles:       [],
    } );
    const { talents } = await adaptTalents( [ talent ] );

    const adaptedTalent = talents[ 0 ];
    expect( adaptedTalent.sourceSecondStepId ).toBeUndefined();
    expect( adaptedTalent.atLevel ).toBeUndefined();
    expect( adaptedTalent.resolved.data.system.talentCategory ).toBe( "other" );
  } );

  it( "excludes item-type talents and returns them as matrixGrants instead", async () => {
    const itemTalent = baseTalent( {
      type:          "item",
      source:        idSource( "ED4FastoonsVeryImpressiveStaff" ),
      disciplineIds: [],
      circles:       [],
      spell:         idSource( "ED4ECloudSummon" ),
      rank:          6,
    } );
    const { talents, matrixGrants } = await adaptTalents( [ itemTalent ] );

    expect( talents ).toHaveLength( 0 );
    expect( matrixGrants ).toEqual( [ {
      equipmentSecondStepId: "ED4FastoonsVeryImpressiveStaff",
      spellSecondStepId:     "ED4ECloudSummon",
      level:                  6,
    } ] );
  } );

} );