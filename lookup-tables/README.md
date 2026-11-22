# SecondStep item lookup tables

Each JSON file is keyed by the complete, case-sensitive SecondStep ID. Each entry has exactly two fields:

```json
{
  "ED4AstralSight": {
    "uuid": "Compendium.earthdawn-pg-compendium.playersguide-talents-en.Item.YXl3sKauOLypPtmH",
    "edid": "talent-astral-sight"
  }
}
```

The tables cover 4,404 distinct Item definitions from 33 supplied SecondStep catalog files. All twelve primary types are populated: armor, devotion, discipline, equipment, namegiver, path, questor, shield, skill, spell, talent and weapon. Knack and thread definitions are also included. Duplicate definitions with the same ID and type are combined; the two pre-existing talent mappings are preserved.

## Matching and review

The offline scan inspected 9,394 standalone Items in 136 installed Earthdawn compendium packs. Only same-type Items from packs declaring `ed4e` are eligible for accepted UUIDs. English and the corresponding source book are preferred. When a module contains both an old unsuffixed pack and its language-specific replacement, the replacement is preferred. Actor-owned items are excluded.

2,590 entries have an accepted UUID. The remaining 1,814 have `uuid: null` and an ED-ID. Approximate, ambiguous, community/older-edition, legacy-schema, and mechanically contradictory candidates are retained for review rather than activated automatically.

See [the review data](../lookup-review.json). Find an entry by `type` and `secondStepId`. `needsReview`, `reason`, `sources`, and `candidates` explain the decision. A candidate UUID is a suggestion, not a confirmed mapping. Scores measure name similarity, not mechanical equivalence. `edidNeedsReview` identifies ED-ID format exceptions. Editing the review file does not change import behavior; apply approved decisions to the corresponding type JSON.

The existing resolver still tries an ED-ID when `uuid` is null. Thus `null` prevents activation of a suggested UUID, but does not disable ED-ID lookup. Review flags are offline metadata; they are not shown automatically by the importer.

## ED-IDs

A chosen Item's non-reserved `system.edid` is reused, including special ED-IDs such as `matrix`. Otherwise the default follows `EdIdField.generateEdId`: strict lowercase Foundry slugification of `type + " - " + name`. Category annotations on knack names are removed before generating a default. The installed Foundry implementation was used directly. Reserved `none` and `any` values are not reused.

Two source names produce double hyphens with the system's current generator: `ED4WyrmWoodBladeWH` and `ED4WyrmWoodBladeWP`. Their generated values are retained verbatim and flagged `edidNeedsReview`; approve a normalized ED-ID before relying on their fallback lookup.

## Types and coverage limits

Equipment types follow the importer's existing mapping: armor and shields retain their types, melee/missile/thrown weapons map to weapon, and other equipment (including thread items) maps to equipment. SecondStep `Magic` definitions map to thread. These tables do not implement the currently deferred import adapters.

SecondStep does not consistently supply native knack types. Improved spells map to spellKnack, Karma knacks to knackKarma, maneuver knacks to knackManeuver, and other knacks to inferred knackAbility. `inferredType` records that distinction. Many installed Deeper Secrets spell knacks still use a generic legacy `knack` type and therefore cannot supply a same-type spellKnack UUID.

177 artisan/knowledge skill name options have no SecondStep ID and are listed under `ignored` in the review data. One `Effects` definition describes an Active Effect rather than an Item and is also listed there. No IDs or native Item types were invented for these rows. Types without supplied definitions remain empty.

The scan verifies offline identities, coverage, and selected metadata, not every rule or live Foundry document preparation. No installed compendium or world was modified. Source filenames, SHA-256 hashes, pack versions, candidates and counts are recorded in the review data; full source catalogs and proprietary rule text are not included.
