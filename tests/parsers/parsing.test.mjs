import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SecondStepFormatError } from "../../module/parsers/errors.mjs";
import { parseSecondStepExport, splitSourceId } from "../../module/parsers/parsing.mjs";

const fixturePath = fileURLToPath(
  new URL( "../fixtures/character-with-almost-everything.json", import.meta.url ),
);
const rawExport = JSON.parse( readFileSync( fixturePath, "utf8" ) );
const TOKEN_REGEX = /^[a-z][a-zA-Z0-9]*$/;

describe( "parseSecondStepExport", () => {

  it( "throws a SecondStepFormatError when StepsVersion is missing", () => {
    expect( () => parseSecondStepExport( {} ) ).toThrow( SecondStepFormatError );
  } );

  it( "parses the full fixture without throwing", () => {
    expect( () => parseSecondStepExport( rawExport ) ).not.toThrow();
  } );

  describe( "basics", () => {
    it( "strips sentinel values from basics to null", () => {
      const { basics } = parseSecondStepExport( rawExport );
      expect( basics.height ).toBeNull();
      expect( basics.weight ).toBeNull();
    } );

    it( "leaves non-sentinel basics values untouched", () => {
      const { basics } = parseSecondStepExport( rawExport );
      expect( basics.name ).toBe( "TestName_the-one-with-everything" );
      expect( basics.player ).toBe( "TestPlayer" );
    } );
  } );

  describe( "attributes", () => {
    it( "parses attributes into full lower-camel attribute names with numeric build points", () => {
      const { attributes } = parseSecondStepExport( rawExport );
      for ( const key of [ "dex", "str", "tou", "per", "wil", "cha" ] ) {
        expect( attributes ).toHaveProperty( key );
        expect( typeof attributes[ key ].buildPoints ).toBe( "number" );
        expect( typeof attributes[ key ].increases ).toBe( "number" );
      }
      expect( attributes.per.buildPoints ).toBe( 12 );
      expect( attributes.str.buildPoints ).toBe( 0 );
    } );
  } );

  describe( "namegiver", () => {
    it( "splits the namegiver ID into id/source", () => {
      const { namegiver } = parseSecondStepExport( rawExport );
      expect( namegiver ).toEqual( {
        id:           "Windling",
        source:       "ED4",
        secondStepId: "ED4Windling",
      } );
    } );
  } );

  describe( "disciplines & paths", () => {
    it( "parses every discipline, preserving string- and number-typed numeric fields alike", () => {
      const { disciplines } = parseSecondStepExport( rawExport );
      expect( disciplines ).toHaveLength( rawExport.Disciplines.length );

      const wizard = disciplines.find( d => d.id.secondStepId === "ED4Wizard" );
      expect( wizard.circle ).toBe( 12 );
      expect( wizard.startedAt ).toBe( 15 ); // raw value is a number
      expect( wizard.optionalTalentsChosen ).toHaveLength( 12 );

      const elementalist = disciplines.find( d => d.id.secondStepId === "ED4Elementalist" );
      expect( elementalist.startedAt ).toBe( 2 ); // raw value is a string
    } );

    it( "parses path rank and granted talents", () => {
      const { paths } = parseSecondStepExport( rawExport );
      expect( paths ).toHaveLength( 1 );
      expect( paths[ 0 ].id ).toEqual( { id: "Windmaster", source: "ED4", secondStepId: "ED4Windmaster" } );
      expect( paths[ 0 ].rank ).toBe( 10 );
      expect( paths[ 0 ].grantedTalents ).toHaveLength( 10 );
      expect( paths[ 0 ].grantedTalents[ 0 ] ).toEqual( { id: "Distract", source: "ED4", secondStepId: "ED4Distract" } );
    } );
  } );

  describe( "talents", () => {
    let talents;

    const byUid = uid => talents.find( t => t.uid === uid );

    it( "parses the correct number of talents", () => {
      talents = parseSecondStepExport( rawExport ).talents;
      expect( talents ).toHaveLength( rawExport.Talents.length );
    } );

    it( "maps the 'Free' cost sentinel to -1 for free talents", () => {
      talents = parseSecondStepExport( rawExport ).talents;
      const freeMatrix = byUid( "011eb8dd-757e-46df-98e5-2219563198a2" );
      expect( freeMatrix.type ).toBe( "free" );
      expect( freeMatrix.lpCostTier ).toBe( -1 );
    } );

    it( "resolves a multi-discipline talent's source to its single CurrentSource", () => {
      talents = parseSecondStepExport( rawExport ).talents;
      const astralSight = byUid( "6b6561fd-3dbf-4121-8b0d-0ed46575185f" );
      expect( astralSight.source ).toEqual( { id: "Windling", source: "ED4", secondStepId: "ED4Windling" } );
    } );

    it( "preserves a legitimate pathRank/bonusRank of 0 or a nonzero value instead of coercing incorrectly", () => {
      talents = parseSecondStepExport( rawExport ).talents;

      const distract = byUid( "ad1bd5bd-00a0-46d2-9aac-28608a6fdb21" );
      expect( distract.type ).toBe( "pathGrantedTalent" );
      expect( distract.pathRank ).toBe( 1 );

      const animalBond = byUid( "9b88216d-39ea-4959-ba66-23184ae3b431" );
      expect( animalBond.type ).toBe( "effectRaisable" );
      expect( animalBond.bonusRank ).toBe( 2 );
    } );

    it( "leaves pathRank/bonusRank undefined when the raw field is entirely absent", () => {
      talents = parseSecondStepExport( rawExport ).talents;
      const pathTalent = byUid( "f1e97e12-e761-4bba-bdbc-dfae940c9b6d" );
      expect( pathTalent.type ).toBe( "pathTalent" );
      expect( pathTalent.pathRank ).toBeUndefined();
    } );

    it( "normalizes every talent type into a lower-camelCase token", () => {
      talents = parseSecondStepExport( rawExport ).talents;
      for ( const talent of talents ) {
        expect( talent.type ).toMatch( TOKEN_REGEX );
      }
    } );
  } );

  describe( "knacks", () => {
    it( "falls back to null for an unmappable attribute sentinel", () => {
      const { knacks } = parseSecondStepExport( rawExport );
      const unmapped = knacks.find( k => k.id.secondStepId === "ED4ArcaneMutteringsArcaneCurses" );
      expect( unmapped.attribute ).toBeNull();

      const mapped = knacks.find( k => k.id.secondStepId === "ED4ArcaneMutteringsJinx" );
      expect( mapped.attribute ).toBe( "cha" );
    } );
  } );

  describe( "skills", () => {
    it( "normalizes skill categories consistently", () => {
      const { skills } = parseSecondStepExport( rawExport );
      expect( skills ).toHaveLength( rawExport.Skills.length );
      for ( const skill of skills ) {
        expect( skill.category ).toMatch( TOKEN_REGEX );
      }
      expect( skills.find( s => s.name === "Accounting" ).category ).toBe( "knowledge" );
      expect( skills.find( s => s.name === "Embroidery" ).category ).toBe( "artisan" );
    } );
  } );

  describe( "equipment", () => {
    let equipment;
    const byId = id => equipment.find( e => e.id.secondStepId === id );

    it( "normalizes equipment types, including multi-word and slash-separated tokens", () => {
      equipment = parseSecondStepExport( rawExport ).equipment;
      expect( equipment ).toHaveLength( rawExport.Equipment.length );
      for ( const item of equipment ) {
        expect( item.type ).toMatch( TOKEN_REGEX );
      }
      expect( byId( "iiiBladeOfCaraFahdAlexsi" ).type ).toBe( "threadItem" );
      expect( byId( "ED4BugRepellent" ).type ).toBe( "healingAidPotion" );
      expect( byId( "GarlenStone" ).type ).toBe( "bloodCharm" );
    } );

    it( "preserves a legitimate damageStep of 0 instead of coercing to undefined", () => {
      equipment = parseSecondStepExport( rawExport ).equipment;
      expect( byId( "Trispear" ).damageStep ).toBe( 0 );
      expect( byId( "Trispear" ).timesForged ).toBe( 2 );
    } );

    it( "treats an explicit null damageStep as undefined", () => {
      equipment = parseSecondStepExport( rawExport ).equipment;
      expect( byId( "WindlingNet" ).damageStep ).toBeUndefined();
    } );

    it( "parses forge counts and thread item rank/cost", () => {
      equipment = parseSecondStepExport( rawExport ).equipment;
      expect( byId( "EspagraCloak" ).timesForgedPhysical ).toBe( 2 );
      expect( byId( "EspagraCloak" ).timesForgedMystical ).toBe( 6 );

      const staff = byId( "ED4FastoonsVeryImpressiveStaff" );
      expect( staff.rank ).toBe( 6 );
      expect( staff.lpCost ).toBe( 5200 );
    } );
  } );

  describe( "questor", () => {
    it( "parses questor passion, devotions and devotion tiers", () => {
      const { questor } = parseSecondStepExport( rawExport );
      expect( questor.passionId ).toEqual( { id: "Mynbruje", source: "ED4", secondStepId: "ED4Mynbruje" } );
      expect( questor.devotions ).toHaveLength( 10 );
      expect( questor.devotions[ 0 ].tier ).toBe( "follower" );
      expect( questor.devotions[ 4 ].tier ).toBe( "adherent" );
      expect( questor.devotions[ 8 ].tier ).toBe( "exemplar" );
    } );

    it( "parses questor as null when the character has no Questor data", () => {
      const withoutQuestor = { ...rawExport, Questor: null };
      const parsed = parseSecondStepExport( withoutQuestor );
      expect( parsed.questor ).toBeNull();
    } );
  } );

  describe( "magic", () => {
    it( "does not throw on magic entries lacking an Applicable field, defaulting them to inactive", () => {
      const { magic } = parseSecondStepExport( rawExport );
      const bloodPromise = magic.find( m => m.id.secondStepId === "ED4BloodPromise" );
      expect( bloodPromise.active ).toBe( false );
    } );

    it( "resolves known thread targets to their EAE characteristic path, case-insensitively", () => {
      const { magic } = parseSecondStepExport( rawExport );
      const corePattern = magic.find( m => m.id.secondStepId === "ED4CorePatternItem" );
      expect( corePattern.threads[ 0 ].target ).toBe( "system.characteristics.defenses.mystical.value" );

      const groupPattern = magic.find( m => m.id.secondStepId === "ED4GroupTruePattern" );
      const durThread = groupPattern.threads.find( t => t.rank === 1 );
      expect( durThread.target ).toBe( "system.durabilityBonus" );
    } );

    it( "splits an unrecognized (e.g. UUID) thread target as an ID instead", () => {
      const { magic } = parseSecondStepExport( rawExport );
      const groupPattern = magic.find( m => m.id.secondStepId === "ED4GroupTruePattern" );
      const abilityThread = groupPattern.threads.find( t => t.rank === 5 && typeof t.target === "object" );
      expect( abilityThread.target.source ).toBeNull();
    } );

    it( "treats an empty top-level Target as undefined", () => {
      const { magic } = parseSecondStepExport( rawExport );
      const corePattern = magic.find( m => m.id.secondStepId === "ED4CorePatternItem" );
      expect( corePattern.target ).toBeUndefined();
    } );
  } );

  describe( "effects & homebrew", () => {
    it( "normalizes effect source and category", () => {
      const { effects } = parseSecondStepExport( rawExport );
      for ( const effect of effects ) {
        expect( effect.source ).toMatch( TOKEN_REGEX );
        expect( effect.category ).toMatch( TOKEN_REGEX );
      }
      expect( effects.some( e => e.category === "legendPointsAward" ) ).toBe( true );
    } );

    it( "does not throw on effect modifiers lacking IsRaisable, leaving it undefined", () => {
      const { homebrewEffects } = parseSecondStepExport( rawExport );
      const customEffect = homebrewEffects.find( e => e.id.secondStepId === "1495f853-87d4-42b5-a0de-932d20f2472a" );
      const combatModifier = customEffect.modifiers.find( m => m.category === "combat" );
      expect( combatModifier.raisable ).toBeUndefined();

      const xTalentModifier = customEffect.modifiers.find( m => m.category === "xtalent" );
      expect( xTalentModifier.raisable ).toBe( true );
    } );

    it( "falls back to the raw string for a non-numeric modifier value", () => {
      const { homebrewEffects } = parseSecondStepExport( rawExport );
      const customEffect = homebrewEffects.find( e => e.id.secondStepId === "1495f853-87d4-42b5-a0de-932d20f2472a" );
      const textModifier = customEffect.modifiers.find( m => m.category === "text" );
      console.log( customEffect, textModifier );
      expect( textModifier.modifier ).toBe( "text effect value 2200" );
    } );

    it( "preserves a legitimate modifier value of 0 from an empty-string source", () => {
      const { homebrewEffects } = parseSecondStepExport( rawExport );
      const lpAward = homebrewEffects.find( e => e.id.secondStepId === "f5f0aa9f-468d-4922-890b-9ad45b443711" );
      expect( lpAward.modifiers[ 0 ].modifier ).toBe( 0 );
    } );
  } );

  describe( "splitSourceId", () => {
    it( "splits a SecondStep ID into id/source/secondStepId", () => {
      const result = splitSourceId( "ED4Windling" );
      expect( result ).toEqual( {
        id:           "Windling",
        source:       "ED4",
        secondStepId: "ED4Windling",
      } );
    } );

    it( "falls back to a null source when no known prefix matches", () => {
      const result = splitSourceId( "SomeUnknownPrefixThing" );
      expect( result.source ).toBeNull();
      expect( result.id ).toBe( "SomeUnknownPrefixThing" );
      expect( result.secondStepId ).toBe( "SomeUnknownPrefixThing" );
    } );
  } );

} );