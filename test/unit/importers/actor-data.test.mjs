import { describe, expect, it, vi } from "vitest";
import { buildActorData } from "../../../module/importers/actor-data.mjs";
import { buildDescriptionHtml } from "../../../module/importers/description.mjs";

vi.mock( "../../../module/importers/description.mjs", () => ( {
  buildDescriptionHtml: vi.fn( () => "<p>described</p>" ),
} ) );

function baseBasics( overrides = {} ) {
  return {
    name:        "Test Name",
    player:      null,
    gender:      null,
    age:         "23",
    height:      null,
    weight:      null,
    hair:        null,
    skin:        null,
    eyes:        null,
    passion:     null,
    traits:      null,
    description: "<div>test description</div>",
    logText:     "<div>test log</div>",
    ...overrides,
  };
}

function baseParsed( overrides = {} ) {
  return {
    basics:       baseBasics(),
    portraitUrl:  null,
    damage:       0,
    wounds:       0,
    legendPoints: 1200,
    ...overrides,
  };
}

function baseAdaptedAttributes() {
  return {
    namegiver:  { data: { name: "Windling", type: "namegiver" }, resolution: "uuid", secondStepId: "ED4Windling", itemType: "namegiver" },
    attributes: {
      dexterity: { initialValue: 12, timesIncreased: 1 },
      strength:  { initialValue: 8, timesIncreased: 0 },
    },
    karma:      { freeAttributePoints: 2 },
  };
}

describe( "buildActorData", () => {

  describe( "identity", () => {

    it( "creates a character with the name from the export", () => {
      const data = buildActorData( baseParsed(), baseAdaptedAttributes() );

      expect( data.type ).toBe( "character" );
      expect( data.name ).toBe( "Test Name" );
    } );

    it( "falls back to a localized name if the export has none", () => {
      const parsed = baseParsed( { basics: baseBasics( { name: null } ) } );

      expect( buildActorData( parsed, baseAdaptedAttributes() ).name ).toBe( "S2F.Character.unnamed" );
    } );

    it( "uses the portrait if the export has a usable one", () => {
      const parsed = baseParsed( { portraitUrl: "https://example.com/portrait.png" } );

      expect( buildActorData( parsed, baseAdaptedAttributes() ).img ).toBe( "https://example.com/portrait.png" );
    } );

    it( "leaves out the image entirely if there is no usable portrait", () => {
      const data = buildActorData( baseParsed( { portraitUrl: null } ), baseAdaptedAttributes() );

      expect( data ).not.toHaveProperty( "img" );
    } );

  } );

  describe( "system data", () => {

    it( "takes over the attributes and the leftover attribute points from the adapter", () => {
      const adaptedAttributes = baseAdaptedAttributes();
      const { system } = buildActorData( baseParsed(), adaptedAttributes );

      expect( system.attributes ).toEqual( adaptedAttributes.attributes );
      expect( system.karma.freeAttributePoints ).toBe( 2 );
    } );

    it( "maps damage and wounds to the health of the character", () => {
      const { system } = buildActorData( baseParsed( { damage: 7, wounds: 2 } ), baseAdaptedAttributes() );

      expect( system.characteristics.health.damage.standard ).toBe( 7 );
      expect( system.characteristics.health.wounds ).toBe( 2 );
    } );

    it( "keeps damage and wounds that are zero", () => {
      const { system } = buildActorData( baseParsed( { damage: 0, wounds: 0 } ), baseAdaptedAttributes() );

      expect( system.characteristics.health.damage ).toHaveProperty( "standard", 0 );
      expect( system.characteristics.health ).toHaveProperty( "wounds", 0 );
    } );

    it( "puts the description and the appearance table into the description", () => {
      const parsed = baseParsed();
      const { system } = buildActorData( parsed, baseAdaptedAttributes() );

      expect( system.description.value ).toBe( "<p>described</p>" );
      expect( buildDescriptionHtml ).toHaveBeenCalledWith( parsed.basics );
    } );

    it( "does not write any legend point data, which is reconstructed later", () => {
      const { system } = buildActorData( baseParsed( { legendPoints: 1200 } ), baseAdaptedAttributes() );

      expect( system ).not.toHaveProperty( "lp" );
    } );

  } );

  describe( "what does not belong into the actor data", () => {

    it( "does not contain items, which are created as embedded documents afterwards", () => {
      const data = buildActorData( baseParsed(), baseAdaptedAttributes() );

      expect( data ).not.toHaveProperty( "items" );
    } );

    it( "does not change the data it was given", () => {
      const parsed = baseParsed( { portraitUrl: "https://example.com/portrait.png", damage: 3 } );
      const adaptedAttributes = baseAdaptedAttributes();
      const parsedSnapshot = structuredClone( parsed );
      const adaptedAttributesSnapshot = structuredClone( adaptedAttributes );

      buildActorData( parsed, adaptedAttributes );

      expect( parsed ).toEqual( parsedSnapshot );
      expect( adaptedAttributes ).toEqual( adaptedAttributesSnapshot );
    } );

  } );

} );