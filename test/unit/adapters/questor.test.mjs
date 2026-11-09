import { describe, expect, it, vi, } from "vitest";
import { idSource } from "../../helpers/factories.mjs";
import { mockLookupTable, mockLookupTables } from "../../mocks/browser.mjs";
import { mockSettingsGetValue, mockUuidDocument, mockUuidDocuments } from "../../mocks/foundry.mjs";
import { adaptQuestor } from "../../../module/adapters/questor.mjs";
import { MODULE_ID } from "../../../module/constants/constants.mjs";

const QUESTOR_ITEM_TYPE = "questor";
const DEVOTION_ITEM_TYPE = "devotion";

const testPassion = "Mynbruje";
const testQuestorDevotionName = "Questor";
const testQuestorDevotionEdid = "questorDevotion";
const testQuestorDevotionTier = "journeyman";
const testQuestorSecondStepId = `ED4${ testPassion }`;
const testQuestorUuid = "Compendium.pack.questor.Item.123";
const testQuestorDevotionUuid = "Compendium.pack.devotion.Item.456";

const testLookupTables = {
  [ QUESTOR_ITEM_TYPE ]: {
    [ testQuestorSecondStepId ]: { uuid: testQuestorUuid, },
  },
  [ DEVOTION_ITEM_TYPE ]: {
    [ testQuestorSecondStepId ]: { uuid: testQuestorDevotionUuid, },
  },
};

function baseQuestor( overrides = {} ) {
  return {
    passionId:           idSource( testQuestorSecondStepId ),
    devotions:           [],
    rank:                10,
    devotionPoints:      0,
    questorDevotionStep: 10,
    ...overrides,
  };
}

function baseQuestorDocument( overrides = {} ) {
  return {
    type:     QUESTOR_ITEM_TYPE,
    toObject: () => ( {
      name:   testPassion,
      type:     QUESTOR_ITEM_TYPE,
      system:   {},
    } ),
    ...overrides,
  };
}

function baseQuestorDevotionDocument( overrides = {} ) {
  return {
    type:     DEVOTION_ITEM_TYPE,
    toObject: () => ( {
      name:   testQuestorDevotionName,
      type:   DEVOTION_ITEM_TYPE,
      system: {
        edid: testQuestorDevotionEdid,
        tier: testQuestorDevotionTier,
      },
    } ),
    ...overrides,
  };
}


describe( "adaptQuestor", () => {

  it( "resolves the questor item by passion id and sets system.level", async () => {
    mockLookupTables( testLookupTables );
    mockUuidDocuments( {
      [ testQuestorUuid ]:         baseQuestorDocument(),
      [ testQuestorDevotionUuid ]: baseQuestorDevotionDocument(),
    } );
    mockSettingsGetValue( undefined );
    // const warn = vi.spyOn( console, "warn" ).mockImplementation( () => {} );

    const { questor } = await adaptQuestor( baseQuestor() );

    expect( questor.secondStepId ).toBe( testQuestorSecondStepId );
    expect( questor.resolved.resolution ).toBe( "uuid" );
    expect( questor.resolved.data.system.level ).toBe( 10 );
  } );

  it( "resolves the questor devotion from the devotion lookup table by uuid", async () => {
    mockLookupTables( testLookupTables );
    mockUuidDocuments( {
      [ testQuestorUuid ]:         baseQuestorDocument(),
      [ testQuestorDevotionUuid ]: baseQuestorDevotionDocument(),
    } );

    const { devotion } = await  adaptQuestor( baseQuestor() );

    const resolvedDevotion = devotion.resolved;
    expect( resolvedDevotion.resolution ).toBe( "uuid" );
    expect( resolvedDevotion.data.name ).toBe( testQuestorDevotionName );
    expect( resolvedDevotion.data.type ).toBe( DEVOTION_ITEM_TYPE );
    expect( resolvedDevotion.data.system.level ).toBe( 10 );
    expect( resolvedDevotion.data.system.edid ).toBe( testQuestorDevotionEdid );
    expect( resolvedDevotion.data.system.tier ).toBe( testQuestorDevotionTier );
    expect( globalThis.game.ed4e.helpers.document.getSingleGlobalItemByEdid ).not.toHaveBeenCalled();
  } );

  it( "synthesizes a minimal questor devotion and warns when neither the table nor the generic template resolve", async () => {
    const lookupTablesWithoutDevotion = testLookupTables;
    lookupTablesWithoutDevotion[ DEVOTION_ITEM_TYPE ] = {};
    mockLookupTables( lookupTablesWithoutDevotion );
    mockUuidDocument( baseQuestorDocument() );
    mockSettingsGetValue( testQuestorDevotionEdid );

    const { devotion } = await adaptQuestor( baseQuestor() );

    expect( globalThis.game.ed4e.helpers.document.getSingleGlobalItemByEdid ).not.toHaveBeenCalled();
    expect( devotion.resolved.resolution ).toBe( "synthesized" );
    expect( devotion.resolved.data.flags[ MODULE_ID ].unresolved ).toBe( true );
    expect( devotion.resolved.data.system.level ).toBe( 10 );
    expect( devotion.resolved.data.system.edid ).toBe( testQuestorDevotionEdid );
    expect( devotion.resolved.data.system.tier ).toBe( "journeyman" );
  } );

  it( "falls back to a synthesized questor item if it cannot be resolved via the lookup table or edid", async () => {
    mockLookupTable( { questor: {}, devotion: {} } );
    mockSettingsGetValue( testQuestorDevotionEdid );

    const { questor } = await adaptQuestor( baseQuestor() );

    expect( questor.resolved.resolution ).toBe( "synthesized" );
    expect( questor.resolved.data.flags[ MODULE_ID ].unresolved ).toBe( true );
    expect( questor.resolved.data.system.level ).toBe( 10 );
  } );

} );
