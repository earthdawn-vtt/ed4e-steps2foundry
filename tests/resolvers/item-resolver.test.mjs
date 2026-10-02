/* eslint-disable jsdoc/require-jsdoc */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLookupTableCache } from "../../module/resolvers/lookup-tables.mjs";
import { resolveItem } from "../../module/resolvers/item-resolver.mjs";

const idSource = ( secondStepId ) => ( { id: "Whatever", source: "ED4", secondStepId } );

beforeEach( () => {
  clearLookupTableCache();
  globalThis.fromUuid = vi.fn();
  globalThis.foundry = { utils: { mergeObject: ( target, source ) => Object.assign( target, source ) } };
  globalThis.game = { ed4e: { helpers: { document: { getSingleGlobalItemByEdid: vi.fn() } } } };
  globalThis.fetch = vi.fn();
} );

afterEach( () => {
  vi.restoreAllMocks();
} );

function mockTable( table ) {
  globalThis.fetch.mockResolvedValue( { ok: true, json: async () => table } ) ;
}

describe( "resolveItems", () => {

  it( "resolves via UUID when the table entry matches the expected type", async () => {
    mockTable( { "ED4Foo": { uuid: "Compendium.pack.talent.Item.123" } } );
    globalThis.fromUuid.mockResolvedValue( { type: "talent", toObject: () => ( { name: "Foo" } ) } );

    const result = await resolveItem( idSource( "ED4Foo" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "uuid" );
    expect( result.data ).toEqual( { name: "Foo" } );
  } );

  it( "falls back to edid when the UUID is stale (wrong type)", async () => {
    mockTable( { "ED4Foo": { uuid: "Compendium.pack.talent.Item.123", edid: "talent-foo" } } );
    globalThis.fromUuid.mockResolvedValue( { type: "skill", toObject: () => ( {} ) } );
    globalThis.game.ed4e.helpers.document.getSingleGlobalItemByEdid.mockResolvedValue(
      { toObject: () => ( { name: "FoundViaEdid" } ) },
    );

    const result = await resolveItem( idSource( "ED4Foo" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "edid" );
    expect( result.data ).toEqual( { name: "FoundViaEdid" } );
  } );

  it( "falls back to edid when the UUID resolves to nothing", async () => {
    mockTable( { "ED4Foo": { uuid: "Compendium.pack.talent.Item.123", edid: "talent-foo" } } );
    globalThis.fromUuid.mockResolvedValue( null );
    globalThis.game.ed4e.helpers.document.getSingleGlobalItemByEdid.mockResolvedValue(
      { toObject: () => ( { name: "FoundViaEdid" } ) },
    );

    const result = await resolveItem( idSource( "ED4Foo" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "edid" );
  } );

  it( "synthesizes and flags the item when neither tier resolves", async () => {
    mockTable( {} );

    const result = await resolveItem( idSource( "ED4Unknown" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "synthesized" );
    expect( result.data.name ).toBe( "Synthesized" );
    expect( result.data.flags[ "ed4e-steps2foundry" ] ).toEqual( {
      unresolved:   true,
      secondStepId: "ED4Unknown",
    } );
  } );

  it( "synthesizes when the lookup table has no entry for this ID at all", async () => {
    mockTable( { "ED4Other": { uuid: "Compendium.pack.talent.Item.999" } } );

    const result = await resolveItem( idSource( "ED4Missing" ), "talent", () => ( { name: "Synthesized" } ) );

    expect( result.resolution ).toBe( "synthesized" );
    expect( globalThis.fromUuid ).not.toHaveBeenCalled();
  } );

  it( "caches the lookup table so fetch is only called once per item type", async () => {
    mockTable( { "ED4Foo": { uuid: "Compendium.pack.talent.Item.123" } } );
    globalThis.fromUuid.mockResolvedValue( { type: "talent", toObject: () => ( {} ) } );

    await resolveItem( idSource( "ED4Foo" ), "talent", () => ( {} ) );
    await resolveItem( idSource( "ED4Foo" ), "talent", () => ( {} ) );

    expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
  } );

} );