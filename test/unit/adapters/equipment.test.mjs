import { describe, expect, it, vi } from "vitest";
import { mockLookupTable, mockLookupTables } from "../../mocks/browser.mjs";
import { mockUuidDocument, mockUuidDocuments } from "../../mocks/foundry.mjs";
import { mockResolvableItems } from "../../mocks/resolver.mjs";
import { adaptEquipment } from "../../../module/adapters/equipment.mjs";
import {
  MODULE_ID,
  NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES,
} from "../../../module/constants/constants.mjs";
import { idSource, itemDocument } from "../../helpers/factories.mjs";

const SECOND_STEP_TYPES = NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES;

function baseEquipment( overrides = {} ) {
  return {
    id:     idSource( "ED4TestItem" ),
    amount: 1,
    inUse:  false,
    type:   SECOND_STEP_TYPES.adventuring,
    ...overrides,
  };
}

/**
 * Makes the equipment with the given SecondStep ID resolvable through the UUID lookup table.
 * @param {string} itemType - The item type of the document the UUID resolves to.
 * @param {object} [system] - The `system` data of that document.
 * @param {string} [secondStepId] - The SecondStep ID to add to the lookup table.
 */
function mockEquipmentResolvable( itemType, system = {}, secondStepId = "ED4TestItem" ) {
  mockLookupTable( { [ secondStepId ]: { uuid: "Compendium.pack.item.Item.123" } } );
  mockUuidDocument( {
    type:     itemType,
    toObject: () => ( { name: "Test Item", type: itemType, system } ),
  } );
}

describe( "adaptEquipment", () => {

  describe( "resolved items", () => {

    it( "sets the amount on a resolved item", async () => {
      mockEquipmentResolvable( "equipment" );
      const { equipment } = await adaptEquipment( [ baseEquipment( { amount: 3 } ) ] );

      const { resolved } = equipment[ 0 ];
      expect( resolved.resolution ).toBe( "uuid" );
      expect( resolved.itemType ).toBe( "equipment" );
      expect( resolved.data.system.amount ).toBe( 3 );
    } );

    it( "resolves the item type from the Second Step equipment type", async () => {
      mockEquipmentResolvable( "weapon" );
      const { equipment } = await adaptEquipment( [ baseEquipment( { type: SECOND_STEP_TYPES.meleeWeapon } ) ] );

      const { resolved } = equipment[ 0 ];
      expect( resolved.itemType ).toBe( "weapon" );
      expect( resolved.resolution ).toBe( "uuid" );
    } );

    it( "treats a valuable that is not a coin like any other item", async () => {
      mockEquipmentResolvable( "equipment", {}, "Orichalcum" );
      const orichalcum = baseEquipment( { id: idSource( "Orichalcum", "" ), type: SECOND_STEP_TYPES.valuable } );
      const { equipment } = await adaptEquipment( [ orichalcum ] );

      expect( equipment[ 0 ].resolved.resolution ).toBe( "uuid" );
    } );

  } );

  describe( "synthesized items", () => {

    it( "flags an item that cannot be resolved for review", async () => {
      const { equipment } = await adaptEquipment( [
        baseEquipment( { type: SECOND_STEP_TYPES.armor, amount: 2 } ),
      ] );

      const { resolved } = equipment[ 0 ];
      expect( resolved.resolution ).toBe( "synthesized" );
      expect( resolved.itemType ).toBe( "armor" );
      expect( resolved.data.type ).toBe( "armor" );
      expect( resolved.data.name ).toBe( "TestItem" );
      expect( resolved.data.system.amount ).toBe( 2 );
      expect( resolved.data.flags[ MODULE_ID ].unresolved ).toBe( true );
    } );

  } );

  describe( "coins", () => {

    it.each( [
      [ "Gold", "gold" ],
      [ "Silver", "silver" ],
      [ "Copper", "copper" ],
    ] )( "builds %s as an equipment priced in %s without consulting the resolver", async ( id, denomination ) => {
      const coin = baseEquipment( { id: idSource( id, "" ), type: SECOND_STEP_TYPES.valuable, amount: 100 } );
      const { equipment } = await adaptEquipment( [ coin ] );

      const { resolved } = equipment[ 0 ];
      expect( resolved.resolution ).toBe( "synthesized" );
      expect( resolved.itemType ).toBe( "equipment" );
      expect( resolved.secondStepId ).toBe( id );
      expect( resolved.data.type ).toBe( "equipment" );
      expect( resolved.data.name ).toBe( `S2F.Synthesized.Name.Coin.${ denomination }` );
      expect( resolved.data.system.amount ).toBe( 100 );
      expect( resolved.data.system.price ).toEqual( { value: 1, denomination } );

      // Coins are created on purpose, so they must not show up as unresolved.
      expect( resolved.data.flags?.[ MODULE_ID ]?.unresolved ).toBeUndefined();
      expect( globalThis.fromUuid ).not.toHaveBeenCalled();
      expect( globalThis.fetch ).not.toHaveBeenCalled();
    } );

    it( "recognizes coins regardless of the casing of their ID", async () => {
      const coin = baseEquipment( { id: idSource( "SILVER", "" ), type: SECOND_STEP_TYPES.valuable } );
      const { equipment } = await adaptEquipment( [ coin ] );

      expect( equipment[ 0 ].resolved.data.system.price.denomination ).toBe( "silver" );
    } );

  } );

  describe( "item status", () => {

    it.each( [
      [ SECOND_STEP_TYPES.armor, "armor" ],
      [ SECOND_STEP_TYPES.shield, "shield" ],
      [ SECOND_STEP_TYPES.adventuring, "equipment" ],
    ] )( "equips a %s that is in use (%s item)", async ( type, itemType ) => {
      mockEquipmentResolvable( itemType );
      const { equipment } = await adaptEquipment( [ baseEquipment( { type, inUse: true } ) ] );

      expect( equipment[ 0 ].resolved.data.system.itemStatus ).toBe( "equipped" );
    } );

    it( "equips a weapon that is in use with the wielding type of the weapon itself", async () => {
      mockEquipmentResolvable( "weapon", { wieldingType: "twoHands" } );
      const { equipment } = await adaptEquipment( [
        baseEquipment( { type: SECOND_STEP_TYPES.meleeWeapon, inUse: true } ),
      ] );

      expect( equipment[ 0 ].resolved.data.system.itemStatus ).toBe( "twoHands" );
    } );

    it( "equips a weapon in the main hand if it has no wielding type", async () => {
      const { equipment } = await adaptEquipment( [
        baseEquipment( { type: SECOND_STEP_TYPES.meleeWeapon, inUse: true } ),
      ] );

      expect( equipment[ 0 ].resolved.data.system.itemStatus ).toBe( "mainHand" );
    } );

    it.each( [
      [ SECOND_STEP_TYPES.meleeWeapon ],
      [ SECOND_STEP_TYPES.armor ],
      [ SECOND_STEP_TYPES.shield ],
      [ SECOND_STEP_TYPES.adventuring ],
    ] )( "marks a %s that is not in use as carried", async ( type ) => {
      const { equipment } = await adaptEquipment( [ baseEquipment( { type, inUse: false } ) ] );

      expect( equipment[ 0 ].resolved.data.system.itemStatus ).toBe( "carried" );
    } );

  } );

  describe( "forging", () => {

    it( "sets the forge bonus of a forged weapon", async () => {
      mockEquipmentResolvable( "weapon", { forgeBonus: 0 } );
      const { equipment } = await adaptEquipment( [
        baseEquipment( { type: SECOND_STEP_TYPES.meleeWeapon, timesForged: 2 } ),
      ] );

      expect( equipment[ 0 ].resolved.data.system.forgeBonus ).toBe( 2 );
    } );

    it( "sets both forge bonuses of forged armor and keeps its armor values", async () => {
      mockEquipmentResolvable( "armor", {
        physical: { armor: 3, forgeBonus: 0 },
        mystical: { armor: 1, forgeBonus: 0 },
      } );
      const { equipment } = await adaptEquipment( [
        baseEquipment( { type: SECOND_STEP_TYPES.armor, timesForgedPhysical: 2, timesForgedMystical: 1 } ),
      ] );

      const { system } = equipment[ 0 ].resolved.data;
      expect( system.physical ).toEqual( { armor: 3, forgeBonus: 2 } );
      expect( system.mystical ).toEqual( { armor: 1, forgeBonus: 1 } );
    } );

    it( "only changes the forge bonuses Second Step reports", async () => {
      mockEquipmentResolvable( "armor", {
        physical: { armor: 3, forgeBonus: 1 },
        mystical: { armor: 1, forgeBonus: 1 },
      } );
      const { equipment } = await adaptEquipment( [
        baseEquipment( { type: SECOND_STEP_TYPES.armor, timesForgedPhysical: 2 } ),
      ] );

      const { system } = equipment[ 0 ].resolved.data;
      expect( system.physical.forgeBonus ).toBe( 2 );
      expect( system.mystical.forgeBonus ).toBe( 1 );
    } );

    it( "applies forging to a synthesized armor that has no armor data yet", async () => {
      const { equipment } = await adaptEquipment( [
        baseEquipment( { type: SECOND_STEP_TYPES.armor, timesForgedPhysical: 2 } ),
      ] );

      expect( equipment[ 0 ].resolved.data.system.physical.forgeBonus ).toBe( 2 );
    } );

  } );

  describe( "thread items", () => {

    const threadItem = ( overrides = {} ) => baseEquipment( { type: SECOND_STEP_TYPES.threadItem, ...overrides } );

    it( "adapts a thread item like any other equipment, with no separate list", async () => {
      const result = await adaptEquipment( [ threadItem() ] );

      expect( result ).not.toHaveProperty( "threadItems" );
      expect( result.equipment ).toHaveLength( 1 );
      expect( result.equipment[ 0 ].resolved.resolution ).toBe( "synthesized" );
      expect( result.equipment[ 0 ].resolved.itemType ).toBe( "equipment" );
    } );

    it.each( [
      [ "weapon" ],
      [ "armor" ],
      [ "shield" ],
      [ "equipment" ],
    ] )( "resolves a thread item that is a %s in the compendium", async ( itemType ) => {
      mockResolvableItems( [ { secondStepId: "ED4TestItem", itemType, name: "Magic Thing" } ] );

      const { equipment } = await adaptEquipment( [ threadItem() ] );

      expect( equipment[ 0 ].resolved.resolution ).toBe( "uuid" );
      expect( equipment[ 0 ].resolved.itemType ).toBe( itemType );
      expect( equipment[ 0 ].resolved.data.name ).toBe( "Magic Thing" );
    } );

    it( "does not accept a document of another type for a thread item", async () => {
      vi.spyOn( console, "warn" ).mockImplementation( () => {} );
      mockLookupTables( { equipment: { ED4TestItem: { uuid: "uuid-talent" } } } );
      mockUuidDocuments( { "uuid-talent": itemDocument( "talent" ) } );

      const { equipment } = await adaptEquipment( [ threadItem() ] );

      expect( equipment[ 0 ].resolved.resolution ).toBe( "synthesized" );
    } );

    it( "equips a thread item that is a weapon with the wielding type of the weapon", async () => {
      mockResolvableItems( [
        { secondStepId: "ED4TestItem", itemType: "weapon", system: { wieldingType: "twoHands" } },
      ] );

      const { equipment } = await adaptEquipment( [ threadItem( { inUse: true } ) ] );

      expect( equipment[ 0 ].resolved.data.system.itemStatus ).toBe( "twoHands" );
    } );

    it( "applies weapon forging to a thread item that is a weapon", async () => {
      mockResolvableItems( [ { secondStepId: "ED4TestItem", itemType: "weapon", system: { forgeBonus: 0 } } ] );

      const { equipment } = await adaptEquipment( [ threadItem( { timesForged: 2 } ) ] );

      expect( equipment[ 0 ].resolved.data.system.forgeBonus ).toBe( 2 );
    } );

    it( "applies armor forging to a thread item that is armor", async () => {
      mockResolvableItems( [ {
        secondStepId: "ED4TestItem",
        itemType:     "armor",
        system:       { physical: { armor: 3, forgeBonus: 0 } },
      } ] );

      const { equipment } = await adaptEquipment( [ threadItem( { timesForgedPhysical: 1 } ) ] );

      expect( equipment[ 0 ].resolved.data.system.physical ).toEqual( { armor: 3, forgeBonus: 1 } );
    } );

    it( "keeps a thread item at its position among the other equipment", async () => {
      const { equipment } = await adaptEquipment( [
        baseEquipment( { id: idSource( "ED4First" ) } ),
        threadItem( { id: idSource( "ED4Second" ) } ),
        baseEquipment( { id: idSource( "ED4Third" ) } ),
      ] );

      expect( equipment.map( adapted => adapted.resolved.secondStepId ) )
        .toEqual( [ "ED4First", "ED4Second", "ED4Third" ] );
    } );

  } );

} );
