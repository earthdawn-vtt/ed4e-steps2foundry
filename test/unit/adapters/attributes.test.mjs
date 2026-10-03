import { describe, expect, it, vi } from "vitest";
import { mockLookupTable } from "../../mocks/browser.mjs";
import { mockUuidDocument } from "../../mocks/foundry.mjs";
import { adaptAttributes } from "../../../module/adapters/attributes.mjs";

const idSource = ( secondStepId ) => ( { id: secondStepId.replace( "ED4", "" ), source: "ED4", secondStepId } );

const attribute = ( buildPoints, increases = 0 ) => ( { buildPoints, increases } );

/**
 * Stubs a resolvable namegiver with the given attribute base values.
 * @param {Record<string, number>} attributeValues - The  namegiver's base attribute values, keyed by attribute abbreviation.
 */
function mockNamegiverResolvable( attributeValues ) {
  mockLookupTable( { "ED4Windling": { uuid: "Compendium.pack.namegiver.Item.123" } } );
  mockUuidDocument( {
    type:     "namegiver",
    toObject: () => ( {
      name:   "Windling",
      type:   "namegiver",
      system: { attributeValues },
    } )
  } );
}

/**
 * Stubs a resolvable namegiver with default attribute values.
 * @param {number} [defaultValue=10] - The default value for each attribute.
 */
function mockDefaultNamegiverResolvable( defaultValue = 10 ) {
  mockNamegiverResolvable( {
    dex: defaultValue,
    str: defaultValue,
    tou: defaultValue,
    per: defaultValue,
    wil: defaultValue,
    cha: defaultValue
  } );
}

/**
 * Creates a default set of parsed attributes with the given build point and increase counts.
 * @param {number} [defaultBuildPoints=0] - The default build point count for each attribute.
 * @param {number} [defaultIncreases=0] - The default increase count for each attribute.
 * @returns {Record<string, { buildPoints: number, increases: number }>} - An object containing the parsed attributes.
 */
function defaultParsedAttributes( defaultBuildPoints = 0, defaultIncreases = 0 ) {
  return {
    dex: attribute( defaultBuildPoints, defaultIncreases, ),
    str: attribute( defaultBuildPoints, defaultIncreases, ),
    tou: attribute( defaultBuildPoints, defaultIncreases, ),
    per: attribute( defaultBuildPoints, defaultIncreases, ),
    wil: attribute( defaultBuildPoints, defaultIncreases, ),
    cha: attribute( defaultBuildPoints, defaultIncreases, ),
  };
}

describe( "adaptAttributes", () => {

  it( "computes initialValue from the namegiver base plus the buildpoint modifier", async () => {
    mockNamegiverResolvable( { dex: 14, str: 9, tou: 9, per: 12, wil: 10, cha: 11 } );

    const parsedAttributes = {
      dex: attribute( 3 ),
      str: attribute( 0 ),
      tou: attribute( 3 ),
      per: attribute( 12 ),
      wil: attribute( 5 ),
      cha: attribute( 1 ),
    };

    const result = await adaptAttributes( idSource( "ED4Windling" ), parsedAttributes, 25 );

    expect( result.attributes.dex.initialValue ).toBe( 14 + 3 ); // modifier for cost 3 is 3
    expect( result.attributes.str.initialValue ).toBe( 9 + 0 );
    expect( result.attributes.tou.initialValue ).toBe( 9 + 3 );
    expect( result.attributes.per.initialValue ).toBe( 12 + 7 ); // modifier for cost 12 is 7
    expect( result.attributes.wil.initialValue ).toBe( 10 + 4 ); // modifier for cost 5 is 4
    expect( result.attributes.cha.initialValue ).toBe( 11 + 1 );
  } );

  it( "passes the Increases count through directly as timesIncreased, without any cost lookup", async () => {
    mockDefaultNamegiverResolvable();

    const parsedAttributes = defaultParsedAttributes( 0 );
    parsedAttributes.dex.increases = 2;

    const result = await adaptAttributes( idSource( "ED4Windling" ), parsedAttributes, 25 );

    expect( result.attributes.dex.timesIncreased ).toBe( 2 );
    expect( result.attributes.str.timesIncreased ).toBe( 0 );
  } );

  it( "computes leftover attribute points from the raw buildpoint costs, not their modifiers", async () => {
    mockDefaultNamegiverResolvable();
    const parsedAttributes = {
      dex: attribute( 3 ),
      str: attribute( 0 ),
      tou: attribute( 3 ),
      per: attribute( 12 ),
      wil: attribute( 5 ),
      cha: attribute( 1 ),
    };

    const result = await adaptAttributes( idSource( "ED4Windling" ), parsedAttributes, 25 );

    // 3 + 0 + 3 +12 + 5 +1 = 24
    expect( result.karma.freeAttributePoints ).toBe( 1 );
  } );

  it( "falls back to the schema default base value (10) when the namegiver cannot be resolved", async () => {
    globalThis.fetch.mockResolvedValueOnce( { ok: true, json: async () => ( {} ) } );

    const parsedAttributes = defaultParsedAttributes( 0 );
    parsedAttributes.dex.buildPoints = 3;

    const result = await adaptAttributes( idSource( "ED4SomeUnmappedNamegiver" ), parsedAttributes, 25 );

    expect( result.namegiver.resolution ).toBe( "synthesized" );
    expect( result.attributes.dex.initialValue ).toBe( 10 + 3 );
    expect( result.attributes.str.initialValue ).toBe( 10 + 0 );
  } );

  it( "throws when a buildpoint cost does not match any known SecondStep attribute cost tier", async () => {
    mockDefaultNamegiverResolvable();

    const parsedAttributes = defaultParsedAttributes();
    parsedAttributes.dex.buildPoints = 999;

    await expect(
      adaptAttributes( idSource( "ED4Windling" ), parsedAttributes, 25 )
    ).rejects.toThrow( /Unrecognized SecondStep attribute buildpoint cost/ );
  } );
} );