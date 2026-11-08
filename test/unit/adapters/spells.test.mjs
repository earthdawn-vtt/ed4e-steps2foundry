import { describe, expect, it } from "vitest";
import { mockLookupTable } from "../../mocks/browser.mjs";
import { mockUuidDocument } from "../../mocks/foundry.mjs";
import { adaptSpells } from "../../../module/adapters/spells.mjs";
import { MODULE_ID } from "../../../module/constants/constants.mjs";
import { idSource } from "../../helpers/factories.mjs";

function baseSpell( overrides = {} ) {
  return {
    id:    idSource( "ED4WCatchSpell" ),
    index: 0,
    ...overrides,
  };
}

/**
 * Makes the spell with the given SecondStep ID resolvable through the UUID lookup table.
 * @param {object} [system] - The `system` data of the document the UUID resolves to.
 * @param {string} [name] - The name of that document.
 * @param {string} [secondStepId] - The SecondStep ID to add to the lookup table.
 */
function mockSpellResolvable( system = {}, name = "Catch Spell", secondStepId = "ED4WCatchSpell" ) {
  mockLookupTable( { [ secondStepId ]: { uuid: "Compendium.pack.item.Item.123" } } );
  mockUuidDocument( {
    type:     "spell",
    toObject: () => ( { name, type: "spell", system: { ...system } } ),
  } );
}

describe( "adaptSpells", () => {

  describe( "resolved spells", () => {

    it( "returns the compendium item without changing it", async () => {
      mockSpellResolvable( { level: 3, spellcastingType: "wizardry" } );
      const { spells } = await adaptSpells( [ baseSpell() ] );

      const { resolved } = spells[ 0 ];
      expect( resolved.resolution ).toBe( "uuid" );
      expect( resolved.itemType ).toBe( "spell" );
      expect( resolved.data.name ).toBe( "Catch Spell" );
      expect( resolved.data.system ).toEqual( { level: 3, spellcastingType: "wizardry" } );
    } );

    it( "lets the compendium decide the casting type instead of the letter of the ID", async () => {
      mockSpellResolvable( { spellcastingType: "wizardry" }, "Catch Spell", "ED4ECatchSpell" );
      const { spells } = await adaptSpells( [ baseSpell( { id: idSource( "ED4ECatchSpell" ) } ) ] );

      expect( spells[ 0 ].resolved.data.system.spellcastingType ).toBe( "wizardry" );
    } );

    it( "does not flag a resolved spell for review", async () => {
      mockSpellResolvable();
      const { spells } = await adaptSpells( [ baseSpell() ] );

      expect( spells[ 0 ].resolved.data.flags?.[ MODULE_ID ]?.unresolved ).toBeUndefined();
    } );

  } );

  describe( "synthesized spells", () => {

    it.each( [
      [ "E", "elementalism" ],
      [ "I", "illusionism" ],
      [ "N", "nethermancy" ],
      [ "S", "shamanism" ],
      [ "W", "wizardry" ],
    ] )( "derives the casting type of a spell with the letter %s as %s", async ( letter, spellcastingType ) => {
      const { spells } = await adaptSpells( [ baseSpell( { id: idSource( `ED4${ letter }TestSpell` ) } ) ] );

      expect( spells[ 0 ].resolved.data.system.spellcastingType ).toBe( spellcastingType );
    } );

    it( "flags a spell that cannot be resolved for review", async () => {
      const { spells } = await adaptSpells( [ baseSpell( { id: idSource( "ED4ECrunchClimb" ) } ) ] );

      const { resolved } = spells[ 0 ];
      expect( resolved.resolution ).toBe( "synthesized" );
      expect( resolved.itemType ).toBe( "spell" );
      expect( resolved.data.type ).toBe( "spell" );
      expect( resolved.secondStepId ).toBe( "ED4ECrunchClimb" );
      expect( resolved.data.flags[ MODULE_ID ].unresolved ).toBe( true );
    } );

    it( "gives a synthesized spell a readable name without the casting letter", async () => {
      const { spells } = await adaptSpells( [ baseSpell( { id: idSource( "ED4ECrunchClimb" ) } ) ] );

      expect( spells[ 0 ].resolved.data.name ).toBe( "Crunch Climb" );
    } );

    it( "does not invent a spell level", async () => {
      const { spells } = await adaptSpells( [ baseSpell() ] );

      expect( spells[ 0 ].resolved.data.system ).not.toHaveProperty( "level" );
    } );

    it.each( [
      // The first character is not a casting letter.
      [ "XFooBar", "X Foo Bar" ],
      // The first character is a casting letter, but it belongs to the name: no uppercase letter follows.
      [ "Elementalism", "Elementalism" ],
      // Single letter ID
      [ "E", "E" ],
    ] )( "does not guess a casting type for the spell ID %s", async ( id, expectedName ) => {
      const { spells } = await adaptSpells( [ baseSpell( { id: idSource( `ED4${ id }` ) } ) ] );

      const { data } = spells[ 0 ].resolved;
      expect( data.system.spellcastingType ).toBeNullable();
      expect( data.name ).toBe( expectedName );
    } );

  } );

  describe( "bookkeeping", () => {

    it( "resolves each spell on its own", async () => {
      mockSpellResolvable( {}, "Catch Spell", "ED4WCatchSpell" );
      const { spells } = await adaptSpells( [
        baseSpell( { id: idSource( "ED4WCatchSpell" ), index: 0 } ),
        baseSpell( { id: idSource( "ED4EUnknownSpell" ), index: 1 } ),
      ] );

      expect( spells.map( adapted => adapted.resolved.resolution ) ).toEqual( [ "uuid", "synthesized" ] );
    } );

    it( "keeps the order of the spells", async () => {
      const { spells } = await adaptSpells( [
        baseSpell( { id: idSource( "ED4EFirst" ), index: 0 } ),
        baseSpell( { id: idSource( "ED4NSecond" ), index: 1 } ),
        baseSpell( { id: idSource( "ED4WThird" ), index: 2 } ),
      ] );

      expect( spells.map( adapted => adapted.resolved.secondStepId ) )
        .toEqual( [ "ED4EFirst", "ED4NSecond", "ED4WThird" ] );
    } );

    it( "returns an empty list if there are no spells", async () => {
      expect( await adaptSpells( [] ) ).toEqual( { spells: [] } );
    } );

  } );

} );