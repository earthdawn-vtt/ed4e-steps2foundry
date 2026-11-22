import { describe, expect, it, vi } from "vitest";
import { resolveItem } from "../../../module/resolvers/item-resolver.mjs";
import { MODULE_ID } from "../../../module/constants/constants.mjs";
import { mockLookupTable, mockLookupTables } from "../../mocks/browser.mjs";
import { mockEdidDocuments, mockUuidDocument, mockUuidDocuments } from "../../mocks/foundry.mjs";
import { mockGlobalItemByEdid } from "../../mocks/ed4e.mjs";
import { idSource, itemDocument } from "../../helpers/factories.mjs";

describe( "resolveItems", () => {

  it( "resolves via UUID when the table entry matches the expected type", async () => {
    mockLookupTable( { "ED4Foo": { uuid: "Compendium.pack.talent.Item.123" } } );
    mockUuidDocument( { type: "talent", toObject: () => ( { name: "Foo" } ) } );

    const result = await resolveItem( idSource( "ED4Foo" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "uuid" );
    expect( result.data ).toEqual( { name: "Foo" } );
  } );

  it( "falls back to edid when the UUID is stale (wrong type) and warns about it", async () => {
    const warn = vi.spyOn( console, "warn" ).mockImplementation( () => {} );
    mockLookupTable( { "ED4Foo": { uuid: "Compendium.pack.talent.Item.123", edid: "talent-foo" } } );
    mockUuidDocument( { type: "skill", toObject: () => ( {} ) } );
    mockGlobalItemByEdid(
      { toObject: () => ( { name: "FoundViaEdid" } ) },
    );

    const result = await resolveItem( idSource( "ED4Foo" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "edid" );
    expect( result.data ).toEqual( { name: "FoundViaEdid" } );
    expect( warn ).toHaveBeenCalledOnce();
    warn.mockRestore();
  } );

  it( "falls back to edid when the UUID resolves to nothing and warns about it", async () => {
    const warn = vi.spyOn( console, "warn" ).mockImplementation( () => {} );
    mockLookupTable( { "ED4Foo": { uuid: "Compendium.pack.talent.Item.123", edid: "talent-foo" } } );
    mockUuidDocument( null );
    mockGlobalItemByEdid(
      { toObject: () => ( { name: "FoundViaEdid" } ) },
    );

    const result = await resolveItem( idSource( "ED4Foo" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "edid" );
    expect( warn ).toHaveBeenCalledOnce();
    warn.mockRestore();
  } );

  it( "synthesizes and flags the item when neither tier resolves", async () => {
    mockLookupTable( {} );

    const result = await resolveItem( idSource( "ED4Unknown" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "synthesized" );
    expect( result.data.name ).toBe( "Synthesized" );
    expect( result.data.flags[ "ed4e-steps2foundry" ] ).toEqual( {
      unresolved:   true,
      secondStepId: "ED4Unknown",
    } );
  } );

  it( "synthesizes when the lookup table has no entry for this ID at all", async () => {
    mockLookupTable( { "ED4Other": { uuid: "Compendium.pack.talent.Item.999" } } );

    const result = await resolveItem( idSource( "ED4Missing" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "synthesized" );
    expect( globalThis.fromUuid ).not.toHaveBeenCalled();
  } );

  it( "caches the lookup table so fetch is only called once per item type", async () => {
    mockLookupTable( { "ED4Foo": { uuid: "Compendium.pack.talent.Item.123" } } );
    mockUuidDocument( { type: "talent", toObject: () => ( {} ) } );

    await resolveItem( idSource( "ED4Foo" ), "talent", () => ( {} ) );
    await resolveItem( idSource( "ED4Foo" ), "talent", () => ( {} ) );

    expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
  } );

} );

describe( "resolveItem with several item types", () => {

  const id = idSource( "ED4MagicThing" );
  const synthesize = () => ( { name: "Synthesized", type: "armor", system: {} } );

  describe( "UUID", () => {

    it( "resolves the UUID from the table of a later type", async () => {
      mockLookupTables( { weapon: {}, armor: { ED4MagicThing: { uuid: "uuid-armor" } } } );
      mockUuidDocuments( { "uuid-armor": itemDocument( "armor", { name: "Plate" } ) } );

      const resolved = await resolveItem( id, [ "weapon", "armor" ], synthesize );

      expect( resolved.resolution ).toBe( "uuid" );
      expect( resolved.itemType ).toBe( "armor" );
      expect( resolved.data.name ).toBe( "Plate" );
    } );

    it( "prefers the type that comes first if several tables know the ID", async () => {
      mockLookupTables( {
        weapon: { ED4MagicThing: { uuid: "uuid-weapon" } },
        armor:  { ED4MagicThing: { uuid: "uuid-armor" } },
      } );
      mockUuidDocuments( {
        "uuid-weapon": itemDocument( "weapon", { name: "Sword" } ),
        "uuid-armor":  itemDocument( "armor", { name: "Plate" } ),
      } );

      const resolved = await resolveItem( id, [ "weapon", "armor" ], synthesize );

      expect( resolved.itemType ).toBe( "weapon" );
      expect( resolved.data.name ).toBe( "Sword" );
    } );

    it( "falls through to the next type if the UUID of the first type is stale", async () => {
      vi.spyOn( console, "warn" ).mockImplementation( () => {} );
      mockLookupTables( {
        weapon: { ED4MagicThing: { uuid: "uuid-stale" } },
        armor:  { ED4MagicThing: { uuid: "uuid-armor" } },
      } );
      mockUuidDocuments( {
        "uuid-stale": itemDocument( "armor", { name: "Wrong" } ),
        "uuid-armor": itemDocument( "armor", { name: "Plate" } ),
      } );

      const resolved = await resolveItem( id, [ "weapon", "armor" ], synthesize );

      expect( resolved.data.name ).toBe( "Plate" );
    } );

    it( "does not accept a document of a type that is not in the list", async () => {
      vi.spyOn( console, "warn" ).mockImplementation( () => {} );
      mockLookupTables( { weapon: { ED4MagicThing: { uuid: "uuid-talent" } } } );
      mockUuidDocuments( { "uuid-talent": itemDocument( "talent" ) } );

      const resolved = await resolveItem( id, [ "weapon", "armor" ], synthesize );

      expect( resolved.resolution ).toBe( "synthesized" );
    } );

  } );

  describe( "EDID", () => {

    it( "tries the UUIDs of all types before any EDID", async () => {
      mockLookupTables( {
        weapon: { ED4MagicThing: { edid: "magic-sword" } },
        armor:  { ED4MagicThing: { uuid: "uuid-armor" } },
      } );
      mockUuidDocuments( { "uuid-armor": itemDocument( "armor", { name: "Plate" } ) } );
      mockEdidDocuments( { "weapon:magic-sword": itemDocument( "weapon", { name: "Sword" } ) } );

      const resolved = await resolveItem( id, [ "weapon", "armor" ], synthesize );

      expect( resolved.resolution ).toBe( "uuid" );
      expect( resolved.itemType ).toBe( "armor" );
      expect( globalThis.game.ed4e.helpers.document.getSingleGlobalItemByEdid ).not.toHaveBeenCalled();
    } );

    it( "falls back to the EDID of a type if no UUID matches", async () => {
      mockLookupTables( { weapon: { ED4MagicThing: { edid: "magic-sword" } } } );
      mockEdidDocuments( { "weapon:magic-sword": itemDocument( "weapon", { name: "Sword" } ) } );

      const resolved = await resolveItem( id, [ "weapon", "armor" ], synthesize );

      expect( resolved.resolution ).toBe( "edid" );
      expect( resolved.itemType ).toBe( "weapon" );
      expect( globalThis.game.ed4e.helpers.document.getSingleGlobalItemByEdid )
        .toHaveBeenCalledWith( "magic-sword", "weapon" );
    } );

  } );

  describe( "synthesized items", () => {

    it( "takes the item type from the data the callback returns", async () => {
      const resolved = await resolveItem( id, [ "weapon", "armor" ], synthesize );

      expect( resolved.resolution ).toBe( "synthesized" );
      expect( resolved.itemType ).toBe( "armor" );
    } );

    it( "falls back to the first type if the data has no type", async () => {
      const resolved = await resolveItem( id, [ "weapon", "armor" ], () => ( { name: "Synthesized" } ) );

      expect( resolved.itemType ).toBe( "weapon" );
    } );

    it( "flags the item for review and remembers the Second Step ID", async () => {
      const resolved = await resolveItem( id, [ "weapon", "armor" ], synthesize );

      expect( resolved.data.flags[ MODULE_ID ] ).toEqual( { unresolved: true, secondStepId: "ED4MagicThing" } );
      expect( resolved.secondStepId ).toBe( "ED4MagicThing" );
    } );

  } );

  describe( "the list of types", () => {

    it( "works like a single type if the list has one type", async () => {
      mockLookupTables( { weapon: { ED4MagicThing: { uuid: "uuid-weapon" } } } );
      mockUuidDocuments( { "uuid-weapon": itemDocument( "weapon", { name: "Sword" } ) } );

      const fromList = await resolveItem( id, [ "weapon" ], synthesize );
      const fromString = await resolveItem( id, "weapon", synthesize );

      expect( fromList ).toEqual( fromString );
      expect( fromString.itemType ).toBe( "weapon" );
    } );

    it( "throws a type error for an empty list, without synthesizing anything", async () => {
      const synthesizeSpy = vi.fn( synthesize );

      await expect( resolveItem( id, [], synthesizeSpy ) ).rejects.toThrow( TypeError );
      expect( synthesizeSpy ).not.toHaveBeenCalled();
    } );

    it( "loads the table of every listed type once", async () => {
      mockLookupTables( {} );

      await resolveItem( idSource( "ED4First" ), [ "weapon", "armor" ], synthesize );
      await resolveItem( idSource( "ED4Second" ), [ "weapon", "armor" ], synthesize );

      expect( globalThis.fetch ).toHaveBeenCalledTimes( 2 );
    } );

  } );

} );