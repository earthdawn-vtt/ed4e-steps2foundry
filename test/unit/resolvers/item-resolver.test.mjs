import { describe, expect, it, vi } from "vitest";
import { resolveItem } from "../../../module/resolvers/item-resolver.mjs";
import { mockLookupTable } from "../../mocks/browser.mjs";
import { mockUuidDocument } from "../../mocks/foundry.mjs";
import { mockGlobalItemByEdid } from "../../mocks/ed4e.mjs";
import { idSource } from "../../helpers/factories.mjs";

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