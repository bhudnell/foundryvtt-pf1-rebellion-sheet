import { maxActions, maxTeams } from "../config.mjs";

function defineOfficer(initial = 0) {
  const fields = foundry.data.fields;

  return new fields.SchemaField({
    name: new fields.StringField(),
    bonus: new fields.NumberField({ integer: true, initial, nullable: false }),
  });
}

export class RebellionModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      details: new fields.SchemaField({
        rank: new fields.NumberField({
          integer: true,
          min: 1,
          max: 20,
          initial: 1,
          nullable: false,
        }),
        maxRank: new fields.NumberField({
          integer: true,
          min: 5,
          max: 20,
          initial: 5,
          nullable: false,
        }),
        focus: new fields.StringField({
          blank: true,
          choices: ["loyalty", "secrecy", "security"],
        }),
        membership: new fields.NumberField({
          integer: true,
          min: 0,
          initial: 0,
          nullable: false,
        }),
        supporters: new fields.NumberField({
          integer: true,
          min: 0,
          initial: 0,
          nullable: false,
        }),
        population: new fields.NumberField({
          integer: true,
          min: 0,
          initial: 11900,
          nullable: false,
        }),
        treasury: new fields.NumberField({
          integer: true,
          initial: 10,
          nullable: false,
        }),
        notoriety: new fields.NumberField({
          integer: true,
          min: 0,
          max: 100,
          initial: 0,
          nullable: false,
        }),
        danger: new fields.NumberField({
          integer: true,
          initial: 20,
          nullable: false,
        }),
      }),
      officers: new fields.SchemaField({
        // TODO make link to actors instead
        demagogue: defineOfficer(),
        partisan: defineOfficer(),
        recruiter: defineOfficer(),
        sentinel: defineOfficer(1),
        spymaster: defineOfficer(),
        strategist: defineOfficer(1),
      }),
      doubleEventChance: new fields.BooleanField({ initial: false }),
    };
  }

  prepareDerivedData() {
    // organization checks
    const focusBase = Math.floor(this.details.rank / 2) + 2;
    const secondaryBase = Math.floor(this.details.rank / 3);
    this.loyalty = {
      base: this.details.focus === "loyalty" ? focusBase : secondaryBase,
      officer: this.officers.demagogue.bonus,
      sentinel: this.details.focus !== "loyalty" && this.officers.sentinel.name ? 1 : 0,
    };
    this.secrecy = {
      base: this.details.focus === "secrecy" ? focusBase : secondaryBase,
      officer: this.officers.spymaster.bonus,
      sentinel: this.details.focus !== "secrecy" && this.officers.sentinel.name ? 1 : 0,
    };
    this.security = {
      base: this.details.focus === "security" ? focusBase : secondaryBase,
      officer: this.officers.partisan.bonus,
      sentinel: this.details.focus !== "security" && this.officers.sentinel.name ? 1 : 0,
    };

    // other details
    this.minTreasury = this.details.rank * 10;
    this.maxActions = maxActions[this.details.rank] + (this.officers.strategist.name ? 1 : 0);
    this.maxTeams = maxTeams[this.details.rank];
  }
}
