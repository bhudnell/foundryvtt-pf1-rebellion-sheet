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
    this.danger.other = 0;
    this.danger.total = this.danger.base + this.danger.other;

    this.loyalty = {
      base: 0,
      officer: 0,
      sentinel: 0,
      other: 0,
      total: 0,
    };
    this.secrecy = {
      base: 0,
      officer: 0,
      sentinel: 0,
      other: 0,
      total: 0,
    };
    this.security = {
      base: 0,
      officer: 0,
      sentinel: 0,
      other: 0,
      total: 0,
    };
  }

  prepareDerivedData() {
    // changes
    this.changes = this._prepareChanges();

    // organization checks
    const focusBase = Math.floor(this.rank / 2) + 2;
    const secondaryBase = Math.floor(this.rank / 3);

    for (const check of Object.keys(pf1rs.config.orgChecks)) {
      this[check].base += this.focus === check ? focusBase : secondaryBase;
      this[check].officer += this.officers[pf1rs.config.orgCheckOfficer[check]].bonus;
      this[check].sentinel += this.focus !== check && this.officers.sentinel.actorId ? 1 : 0;
      this[check].other += this._getChanges(["allOrgChecks", check]);

      if (check === "security") {
        this[check].other += Math.min(5, this.safehouses);
      }

      this[check].total += this[check].base + this[check].officer + this[check].sentinel + this[check].other;
    }

    // actions
    const itemActions = this._getItemActions();
    for (const action of Object.keys(pf1rs.config.actions)) {
      this.actions[action].changeBonus = this._getChanges(action);
      this.actions[action].available = pf1rs.config.alwaysAvailableActions.includes(action) || itemActions.has(action);
      this.actions[action].sources = itemActions.get(action);
    }

    // other details
    this.minTreasury = this.rank * 10;
    this.maxActions = pf1rs.config.maxActions[this.rank] + (this.officers.strategist.actorId ? 1 : 0);
    this.maxTeams = pf1rs.config.maxTeams[this.rank];

    this.danger.other += this._getChanges("danger");
    this.danger.total = this.danger.base + this.danger.other;

    this.eventChance = Math.clamped((this.notoriety + this.danger.total) * (this.doubleEventChance ? 2 : 1), 10, 95);
  }

  _prepareChanges() {
    const changeItems = this.parent.items.filter((item) => item.system.changes?.length > 0);

    const changes = [];
    for (const i of changeItems) {
      changes.push(
        ...i.system.changes.map((c) => ({
          ...c,
          parentId: i.id,
          parentName: i.name,
          mitigated: i.system.mitigated,
        }))
      );
    }

    const c = new Collection();
    for (const change of changes) {
      // Avoid ID conflicts
      const parentId = change.parentId ?? "Actor";
      const uniqueId = `${parentId}-${change.id}`;
      c.set(uniqueId, change);
    }
    return c;
  }

  _getItemActions() {
    const actionItems = this.parent.items.filter(
      (item) => !item.system.disabled && !item.system.missing && item.system.rActions?.value.length > 0
    );
    const actions = new Map();

    for (const item of actionItems) {
      for (const action of item.system.rActions.value) {
        const sources = actions.get(action);
        actions.set(action, [...(sources ?? []), item.name]);
      }
    }

    return actions;
  }

  _getChanges(ability) {
    const abilityArr = Array.isArray(ability) ? ability : [ability];
    return this.changes
      .filter((c) => abilityArr.includes(c.ability))
      .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
  }

  get skills() {
    return {};
  }
}
