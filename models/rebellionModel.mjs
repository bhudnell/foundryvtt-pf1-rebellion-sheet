import { maxActions, maxTeams, orgChecks } from "../config.mjs";

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
          choices: Object.keys(orgChecks),
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
        demagogue: new fields.EmbeddedDataField(defineOfficer("demagogue")),
        partisan: new fields.EmbeddedDataField(defineOfficer("partisan")),
        recruiter: new fields.EmbeddedDataField(defineOfficer("recruiter")),
        sentinel: new fields.EmbeddedDataField(defineOfficer("sentinel")),
        spymaster: new fields.EmbeddedDataField(defineOfficer("spymaster")),
        strategist: new fields.EmbeddedDataField(defineOfficer("strategist")),
      }),
      doubleEventChance: new fields.BooleanField({ initial: false }),
    };
  }

  prepareDerivedData() {
    // organization checks
    this.focusBase = Math.floor(this.details.rank / 2) + 2;
    this.secondaryBase = Math.floor(this.details.rank / 3);

    // other details
    this.minTreasury = this.details.rank * 10;
    this.maxActions = maxActions[this.details.rank] + (this.officers.strategist.actorId ? 1 : 0);
    this.maxTeams = maxTeams[this.details.rank];
  }

  get loyalty() {
    return {
      base: this.details.focus === "loyalty" ? this.focusBase : this.secondaryBase,
      officer: this.officers.demagogue.bonus,
      sentinel: this.details.focus !== "loyalty" && this.officers.sentinel.actorId ? 1 : 0,
    };
  }

  get secrecy() {
    return {
      base: this.details.focus === "secrecy" ? this.focusBase : this.secondaryBase,
      officer: this.officers.spymaster.bonus,
      sentinel: this.details.focus !== "secrecy" && this.officers.sentinel.actorId ? 1 : 0,
    };
  }

  get security() {
    return {
      base: this.details.focus === "security" ? this.focusBase : this.secondaryBase,
      officer: this.officers.partisan.bonus,
      sentinel: this.details.focus !== "security" && this.officers.sentinel.actorId ? 1 : 0,
    };
  }
}

function defineOfficer(name) {
  return class OfficerModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
      const fields = foundry.data.fields;

      return {
        actorId: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
      };
    }

    _initialize(...args) {
      super._initialize(...args);

      this.id = name;
    }

    get name() {
      const officer = game.actors.get(this.actorId);

      if (!officer) {
        return undefined;
      }

      return officer.name;
    }

    get bonus() {
      const officer = game.actors.get(this.actorId);

      if (!officer) {
        return 0;
      }

      switch (this.id) {
        case "demagogue":
          return Math.max(officer.system.abilities.con.mod, officer.system.abilities.cha.mod);
        case "partisan":
          return Math.max(officer.system.abilities.str.mod, officer.system.abilities.wis.mod);
        case "recruiter":
          return officer.system.attributes.hd.total;
        case "sentinel":
          return 1;
        case "spymaster":
          return Math.max(officer.system.abilities.dex.mod, officer.system.abilities.int.mod);
        case "strategist":
          return 1;
        default:
          return 0;
      }
    }
  };
}
