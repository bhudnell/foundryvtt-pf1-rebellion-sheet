import { defineAction } from "./actionModel.mjs";
import { defineOfficer } from "./officerModel.mjs";

export class RebellionModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
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
        choices: Object.keys(pf1rs.config.orgChecks),
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
      week: new fields.NumberField({
        integer: true,
        min: 0,
        initial: 0,
        nullable: false,
      }),
      danger: new fields.SchemaField({
        base: new fields.NumberField({
          integer: true,
          initial: 20,
          nullable: false,
        }),
      }),
      officers: new fields.SchemaField({
        demagogue: new fields.EmbeddedDataField(defineOfficer("demagogue")),
        partisan: new fields.EmbeddedDataField(defineOfficer("partisan")),
        sentinel: new fields.EmbeddedDataField(defineOfficer("sentinel")),
        spymaster: new fields.EmbeddedDataField(defineOfficer("spymaster")),
        strategist: new fields.EmbeddedDataField(defineOfficer("strategist")),
        recruiters: new fields.ArrayField(new fields.EmbeddedDataField(defineOfficer("recruiter")), {
          initial: [{ actorId: null, type: "recruiter", id: foundry.utils.randomID() }],
        }),
      }),
      doubleEventChance: new fields.BooleanField({ initial: false }),
      safehouses: new fields.NumberField({
        integer: true,
        min: 0,
        initial: 0,
        nullable: false,
      }),
      actions: new fields.SchemaField({
        abm: defineAction("secrecy"),
        ash: defineAction(null),
        cor: defineAction(null),
        ca: defineAction(null),
        dt: defineAction("loyalty"),
        eg: defineAction("security"),
        gi: defineAction("secrecy"),
        ge: defineAction(null),
        kc: defineAction("secrecy"),
        ll: defineAction(null),
        me: defineAction(null),
        rs: defineAction("loyalty"),
        rt: defineAction(null),
        rd: defineAction("security"),
        rm: defineAction(null),
        rcc: defineAction("security"),
        rtc: defineAction(null),
        sab: defineAction("secrecy"),
        sc: defineAction("secrecy"),
        sa: defineAction(null),
        so: defineAction(null),
        sd: defineAction("secrecy"),
        ut: defineAction(null),
        ui: defineAction(null),
      }),
      notes: new fields.SchemaField({
        value: new fields.HTMLField({ required: false, blank: true }),
      }),
    };
  }

  static migrateData(data) {
    if (typeof data.notes === "string") {
      data.notes = { value: data.notes };
    }
  }

  prepareBaseData() {
    for (const stat of [...Object.keys(pf1rs.config.orgChecks), "danger"]) {
      this[stat] ??= {};
      this[stat].base ??= 0;
      this[stat].total = 0;
    }

    for (const action of Object.keys(pf1rs.config.actions)) {
      this.actions[action].bonus = 0;
    }
  }

  prepareDerivedData() {
    // organization checks
    const focusBase = Math.floor(this.rank / 2) + 2;
    const secondaryBase = Math.floor(this.rank / 3);

    for (const check of Object.keys(pf1rs.config.orgChecks)) {
      this[check].base = this.focus === check ? focusBase : secondaryBase;
      this[check].total = this[check].base;
    }

    // other details
    this.minTreasury = this.rank * 10;
    this.maxActions = pf1rs.config.maxActions[this.rank] + (this.officers.strategist.actorId ? 1 : 0);
    this.maxTeams = pf1rs.config.maxTeams[this.rank];

    // danger
    this.danger.total = this.danger.base;
  }

  get skills() {
    return {};
  }
}
