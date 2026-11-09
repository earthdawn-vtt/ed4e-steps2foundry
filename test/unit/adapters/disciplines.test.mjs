import { describe, expect, it, } from "vitest";
import { mockLookupTable } from "../../mocks/browser.mjs";
import { mockUuidDocument } from "../../mocks/foundry.mjs";
import { adaptDisciplines } from "../../../module/adapters/disciplines.mjs";
import { MODULE_ID } from "../../../module/constants/constants.mjs";
import { idSource } from "../../helpers/factories.mjs";

function baseDiscipline( overrides = {} ) {
  return {
    id:                    idSource( "ED4Wizard" ),
    circle:                5,
    order:                 0,
    startedAt:             0,
    optionalTalentsChosen: [],
    ...overrides,
  };
}

/**
 * Makes the discipline with the given SecondStep ID resolvable through the UUID lookup table.
 * @param {object} [system] - The `system` data of the document the UUID resolves to.
 * @param {string} [name] - The name of that document.
 * @param {string} [secondStepId] - The SecondStep ID to add to the lookup table.
 */
function mockDisciplineResolvable( system = {}, name = "Wizard", secondStepId = "ED4Wizard" ) {
  mockLookupTable( { [ secondStepId ]: { uuid: "Compendium.pack.item.Item.123" } } );
  mockUuidDocument( {
    type:     "discipline",
    toObject: () => ( { name, type: "discipline", system: { ...system } } ),
  } );
}

describe( "adaptDisciplines", () => {

  describe( "resolved disciplines", () => {

    it( "sets level and one-based order while keeping the other compendium data", async () => {
      mockDisciplineResolvable( { level: 0, order: 0, durability: 7, } );
      const { disciplines } = await adaptDisciplines( [ baseDiscipline( { circle: 4, order: 2 } ) ] );

      const { resolved } = disciplines[ 0 ];
      expect( resolved.resolution ).toBe( "uuid" );
      expect( resolved.itemType ).toBe( "discipline" );
      expect( resolved.data.name ).toBe( "Wizard" );
      expect( resolved.data.system.level ).toBe( 4 );
      expect( resolved.data.system.durability ).toBe( 7 );
      expect( resolved.data.flags?.[ MODULE_ID ]?.unresolved ).toBeUndefined();
    } );

    it.each( [
      [ 0, 1 ],
      [ 1, 2 ],
      [ 3, 4 ],
    ] )( "writes the zero-based Second Step order %i as the one-based system order %i", async ( order, expected ) => {
      mockDisciplineResolvable( { order: 1 } );
      const { disciplines } = await adaptDisciplines( [ baseDiscipline( { order } ) ] );

      expect( disciplines[ 0 ].resolved.data.system.order ).toBe( expected );
    } );

    it( "does not take over data that is not part of the system", async () => {
      mockDisciplineResolvable();
      const { disciplines } = await adaptDisciplines( [
        baseDiscipline( { startedAt: 6, optionalTalentsChosen: [ { circle: 2, id: idSource( "ED4Something" ) } ] } ),
      ] );

      const { system } = disciplines[ 0 ].resolved.data;
      expect( system ).not.toHaveProperty( "startedAt" );
      expect( system ).not.toHaveProperty( "optionalTalentsChosen" );
    } );

    it( "does not flag a resolved discipline for review", async () => {
      mockDisciplineResolvable();
      const { disciplines } = await adaptDisciplines( [ baseDiscipline() ] );

      expect( disciplines[ 0 ].resolved.data.flags?.[ MODULE_ID ]?.unresolved ).toBeUndefined();
    } );

  } );

  describe( "synthesized disciplines", () => {

    it( "flags a discipline that cannot be resolved for review", async () => {
      const { disciplines } = await adaptDisciplines( [ baseDiscipline( {
        id:     idSource( "ED4NightBlade" ),
        circle: 5,
        order:  1,
      } ) ] );

      const { resolved } = disciplines[ 0 ];
      expect( resolved.resolution ).toBe( "synthesized" );
      expect( resolved.itemType ).toBe( "discipline" );
      expect( resolved.data.type ).toBe( "discipline" );
      expect( resolved.secondStepId ).toBe( "ED4NightBlade" );
      expect( resolved.data.flags[ MODULE_ID ].unresolved ).toBe( true );
    } );

    it( "gives a synthesized discipline a readable name", async () => {
      const { disciplines } = await adaptDisciplines( [ baseDiscipline( {
        id: idSource( "ED4NightBlade" )
      } ) ] );

      expect( disciplines[ 0 ].resolved.data.name ).toBe( "Night Blade" );
    } );

    it( "only sets level and order on a synthesized discipline", async () => {
      const { disciplines } = await adaptDisciplines( [ baseDiscipline( {
        circle: 4,
        order:  1,
      } ) ] );

      expect( disciplines[ 0 ].resolved.data.system ).toEqual( { level: 4, order: 2 } );
    } );

  } );

  describe( "bookkeeping", () => {

    it( "resolves each discipline on its own and keeps the order of the disciplines", async () => {
      mockDisciplineResolvable( {}, "Wizard", "ED4Wizard" );
      const { disciplines } = await adaptDisciplines( [
        baseDiscipline( { id: idSource( "ED4Wizard" ), order: 0 } ),
        baseDiscipline( { id: idSource( "ED4Elementalist" ), order: 1 } ),
        baseDiscipline( { id: idSource( "ED4Troubadour" ), order: 2 } ),
      ] );

      expect( disciplines.map( adapted => adapted.resolved.secondStepId ) )
        .toEqual( [ "ED4Wizard", "ED4Elementalist", "ED4Troubadour" ] );
      expect( disciplines.map( adapted => adapted.resolved.resolution ) )
        .toEqual( [ "uuid", "synthesized", "synthesized" ] );
      expect( disciplines.map( adapted => adapted.resolved.data.system.order ) )
        .toEqual( [ 1, 2, 3 ] );
    } );

    it( "returns an empty list if there are no disciplines", async () => {
      expect( await adaptDisciplines( [] ) ).toEqual( { disciplines: [] } );
    } );

  } );

} );