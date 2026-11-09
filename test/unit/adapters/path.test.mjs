import { describe, expect, it } from "vitest";
import { mockLookupTable } from "../../mocks/browser.mjs";
import { mockUuidDocument } from "../../mocks/foundry.mjs";
import { adaptPaths } from "../../../module/adapters/paths.mjs";
import { MODULE_ID } from "../../../module/constants/constants.mjs";
import { idSource } from "../../helpers/factories.mjs";

function basePath( overrides = {} ) {
  return {
    id:             idSource( "ED4Windmaster" ),
    rank:           3,
    linked:         idSource( "ED4Wizard" ),
    grantedTalents: [],
    ...overrides,
  };
}

/**
 * Makes the path with the given SecondStep ID resolvable through the UUID lookup table.
 * @param {object} [system] - The `system` data of the document the UUID resolves to.
 * @param {string} [name] - The name of that document.
 * @param {string} [secondStepId] - The SecondStep ID to add to the lookup table.
 */
function mockPathResolvable( system = {}, name = "Windmaster", secondStepId = "ED4Windmaster" ) {
  mockLookupTable( { [ secondStepId ]: { uuid: "Compendium.pack.item.Item.123" } } );
  mockUuidDocument( {
    type:     "path",
    toObject: () => ( { name, type: "path", system: { ...system } } ),
  } );
}

describe( "adaptPaths", () => {

  describe( "resolved paths", () => {

    it( "sets the rank as level and keeps the rest of the compendium item", async () => {
      mockPathResolvable( { bloodMagicDamage: 3, level: 0 } );
      const { paths } = await adaptPaths( [ basePath( { rank: 6 } ) ] );

      const { resolved } = paths[ 0 ];
      expect( resolved.resolution ).toBe( "uuid" );
      expect( resolved.itemType ).toBe( "path" );
      expect( resolved.data.name ).toBe( "Windmaster" );
      expect( resolved.data.system.level ).toBe( 6 );
      expect( resolved.data.system.bloodMagicDamage ).toBe( 3 );
    } );

    it( "does not flag a resolved path for review", async () => {
      mockPathResolvable();
      const { paths } = await adaptPaths( [ basePath() ] );

      expect( paths[ 0 ].resolved.data.flags?.[ MODULE_ID ]?.unresolved ).toBeUndefined();
    } );

  } );

  describe( "synthesized paths", () => {

    it( "flags a path that cannot be resolved for review", async () => {
      const { paths } = await adaptPaths( [ basePath() ] );

      const { resolved } = paths[ 0 ];
      expect( resolved.resolution ).toBe( "synthesized" );
      expect( resolved.itemType ).toBe( "path" );
      expect( resolved.secondStepId ).toBe( "ED4Windmaster" );
      expect( resolved.data.type ).toBe( "path" );
      expect( resolved.data.name ).toBe( "Windmaster" );
      expect( resolved.data.flags[ MODULE_ID ].unresolved ).toBe( true );
    } );

    it( "only sets the level on a synthesized path", async () => {
      const { paths } = await adaptPaths( [ basePath( { rank: 4 } ) ] );

      expect( paths[ 0 ].resolved.data.system ).toEqual( { level: 4 } );
    } );

  } );

  describe( "linked discipline", () => {

    it( "keeps the full Second Step ID of the linked discipline for the linking step", async () => {
      const { paths } = await adaptPaths( [ basePath( {
        linked: idSource( "ED4Wizard" )
      } ) ] );

      expect( paths[ 0 ].linkedSecondStepId ).toBe( "ED4Wizard" );
    } );

    it( "keeps the ID of a linked discipline that has no source prefix", async () => {
      const { paths } = await adaptPaths( [ basePath( {
        linked: idSource( "Wizard", "" )
      } ) ] );

      expect( paths[ 0 ].linkedSecondStepId ).toBe( "Wizard" );
    } );

    it( "does not take over the granted talents, which come in as talents", async () => {
      mockPathResolvable();
      const { paths } = await adaptPaths( [
        basePath( { grantedTalents: [ idSource( "ED4SomeTalent" ) ] } ),
      ] );

      expect( paths[ 0 ].resolved.data.system ).not.toHaveProperty( "grantedTalents" );
      expect( paths[ 0 ] ).not.toHaveProperty( "grantedTalents" );
    } );

  } );

  describe( "bookkeeping", () => {

    it( "keeps the order of the paths", async () => {
      const { paths } = await adaptPaths( [
        basePath( { id: idSource( "ED4First" ) } ),
        basePath( { id: idSource( "ED4Second" ) } ),
      ] );

      expect( paths.map( adapted => adapted.resolved.secondStepId ) )
        .toEqual( [ "ED4First", "ED4Second" ] );
    } );

    it( "returns an empty list if there are no paths", async () => {
      expect( await adaptPaths( [] ) ).toEqual( { paths: [] } );
    } );

  } );

} );