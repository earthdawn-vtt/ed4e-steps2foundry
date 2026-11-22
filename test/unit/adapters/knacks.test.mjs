import { describe, expect, it } from "vitest";
import { adaptKnacks } from "../../../module/adapters/knacks.mjs";
import { MODULE_ID } from "../../../module/constants/constants.mjs";
import { idSource, parsedKnack } from "../../helpers/factories.mjs";
import { mockResolvableItems } from "../../mocks/resolver.mjs";

describe( "adaptKnacks", () => {

  describe( "resolved knacks", () => {

    it( "keeps the item as the compendium has it", async () => {
      mockResolvableItems( [ {
        secondStepId: "ED4ArcaneMutteringsJinx",
        itemType:     "knackAbility",
        name:         "Jinx",
        system:       { attribute: "cha" },
      } ] );

      const { knacks, skipped } = await adaptKnacks( [
        parsedKnack( { id: idSource( "ED4ArcaneMutteringsJinx" ), attribute: "per" } ),
      ] );

      const { resolved } = knacks[ 0 ];
      expect( skipped ).toEqual( [] );
      expect( resolved.resolution ).toBe( "uuid" );
      expect( resolved.data.name ).toBe( "Jinx" );
      expect( resolved.data.system.attribute ).toBe( "cha" );
    } );

    it.each( [
      [ "knackAbility" ],
      [ "knackKarma" ],
      [ "knackManeuver" ],
      [ "spellKnack" ],
    ] )( "resolves a knack that is a %s in the compendium", async ( itemType ) => {
      mockResolvableItems( [ { secondStepId: "ED4TestKnack", itemType } ] );

      const { knacks } = await adaptKnacks( [ parsedKnack() ] );

      expect( knacks[ 0 ].resolved.itemType ).toBe( itemType );
      expect( knacks[ 0 ].resolved.resolution ).toBe( "uuid" );
    } );

    it( "resolves a knack through its EDID", async () => {
      mockResolvableItems( [ { secondStepId: "ED4TestKnack", itemType: "spellKnack", via: "edid" } ] );

      const { knacks } = await adaptKnacks( [ parsedKnack() ] );

      expect( knacks[ 0 ].resolved.resolution ).toBe( "edid" );
      expect( knacks[ 0 ].resolved.itemType ).toBe( "spellKnack" );
    } );

    it( "keeps a resolved knack that has no attribute", async () => {
      mockResolvableItems( [ { secondStepId: "ED4TestKnack", itemType: "knackKarma" } ] );

      const { knacks, skipped } = await adaptKnacks( [ parsedKnack( { attribute: null } ) ] );

      expect( knacks ).toHaveLength( 1 );
      expect( skipped ).toEqual( [] );
    } );

  } );

  describe( "synthesized knacks", () => {

    it( "creates a knack ability with the attribute and flags it for review", async () => {
      const { knacks, skipped } = await adaptKnacks( [
        parsedKnack( { id: idSource( "ED4ArcaneMutteringsJinx" ), attribute: "cha" } ),
      ] );

      const { resolved } = knacks[ 0 ];
      expect( skipped ).toEqual( [] );
      expect( resolved.resolution ).toBe( "synthesized" );
      expect( resolved.itemType ).toBe( "knackAbility" );
      expect( resolved.data.type ).toBe( "knackAbility" );
      expect( resolved.data.name ).toBe( "Arcane Mutterings Jinx" );
      expect( resolved.data.system.attribute ).toBe( "cha" );
      expect( resolved.data.flags[ MODULE_ID ].unresolved ).toBe( true );
    } );

    it( "skips a knack without an attribute that cannot be resolved", async () => {
      const knack = parsedKnack( { attribute: null } );

      const { knacks, skipped } = await adaptKnacks( [ knack ] );

      expect( knacks ).toEqual( [] );
      expect( skipped ).toHaveLength( 1 );
      expect( skipped[ 0 ] ).toBe( knack );
    } );

    it( "skips an improved spell knack with an attribute, as its spell ID is embedded in its ID", async () => {
      const knack = parsedKnack( { id: idSource( "ED4PatterncraftED4AlterLife" ), attribute: "per" } );

      const { knacks, skipped } = await adaptKnacks( [ knack ] );

      expect( knacks ).toEqual( [] );
      expect( skipped ).toEqual( [ knack ] );
    } );

    it( "resolves an improved spell knack with an embedded spell ID if the compendium has it", async () => {
      mockResolvableItems( [ { secondStepId: "ED4PatterncraftED4AlterLife", itemType: "spellKnack" } ] );

      const { knacks, skipped } = await adaptKnacks( [
        parsedKnack( { id: idSource( "ED4PatterncraftED4AlterLife" ), attribute: "per" } ),
      ] );

      expect( skipped ).toEqual( [] );
      expect( knacks[ 0 ].resolved.itemType ).toBe( "spellKnack" );
    } );

    it( "skips only the knacks that cannot be recognized, and keeps the order of the rest", async () => {
      mockResolvableItems( [ { secondStepId: "ED4Resolved", itemType: "knackKarma" } ] );
      const rollable = parsedKnack( { id: idSource( "ED4Rollable" ), attribute: "cha" } );
      const unknown = parsedKnack( { id: idSource( "ED4Unknown" ), attribute: null } );
      const resolvedWithoutAttribute = parsedKnack( { id: idSource( "ED4Resolved" ), attribute: null } );

      const { knacks, skipped } = await adaptKnacks( [ rollable, unknown, resolvedWithoutAttribute ] );

      expect( knacks.map( adapted => adapted.resolved.secondStepId ) ).toEqual( [ "ED4Rollable", "ED4Resolved" ] );
      expect( skipped ).toEqual( [ unknown ] );
    } );

  } );

  describe( "bookkeeping", () => {

    it( "keeps knacks that share an ID as separate items", async () => {
      mockResolvableItems( [ { secondStepId: "ED4PatterncraftLearnImprovedSpells", itemType: "knackAbility" } ] );
      const knack = () => parsedKnack( { id: idSource( "ED4PatterncraftLearnImprovedSpells" ) } );

      const { knacks } = await adaptKnacks( [ knack(), knack() ] );

      expect( knacks ).toHaveLength( 2 );
      expect( knacks[ 0 ].resolved.data ).not.toBe( knacks[ 1 ].resolved.data );
    } );

    it( "keeps the order of the knacks", async () => {
      const { knacks } = await adaptKnacks( [
        parsedKnack( { id: idSource( "ED4First" ) } ),
        parsedKnack( { id: idSource( "ED4Second" ) } ),
        parsedKnack( { id: idSource( "ED4Third" ) } ),
      ] );

      expect( knacks.map( adapted => adapted.resolved.secondStepId ) )
        .toEqual( [ "ED4First", "ED4Second", "ED4Third" ] );
    } );

    it( "returns empty lists if there are no knacks", async () => {
      expect( await adaptKnacks( [] ) ).toEqual( { knacks: [], skipped: [] } );
    } );

    it( "does not change the knacks it was given", async () => {
      const input = [ parsedKnack( { attribute: null } ), parsedKnack( { id: idSource( "ED4Other" ) } ) ];
      const snapshot = structuredClone( input );

      await adaptKnacks( input );

      expect( input ).toEqual( snapshot );
    } );

  } );

} );
