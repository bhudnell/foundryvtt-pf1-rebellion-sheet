import { changeTargets, maxActions, maxTeams, orgChecks, orgOfficers } from "../config.mjs";

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

    this.changes = this._prepareChanges();
  }

  get loyalty() {
    const base = this.details.focus === "loyalty" ? this.focusBase : this.secondaryBase;
    const officer = this.officers.demagogue.bonus;
    const sentinel = this.details.focus !== "loyalty" && this.officers.sentinel.actorId ? 1 : 0;
    const other = this.changes
      .filter((c) => ["allOrgChecks", "loyalty"].includes(c.ability))
      .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
    const total = base + officer + sentinel + other;

    return { base, officer, sentinel, other, total };
  }

  get secrecy() {
    const base = this.details.focus === "secrecy" ? this.focusBase : this.secondaryBase;
    const officer = this.officers.spymaster.bonus;
    const sentinel = this.details.focus !== "secrecy" && this.officers.sentinel.actorId ? 1 : 0;
    const other = this.changes
      .filter((c) => ["allOrgChecks", "secrecy"].includes(c.ability))
      .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
    const total = base + officer + sentinel + other;

    return { base, officer, sentinel, other, total };
  }

  get security() {
    const base = this.details.focus === "security" ? this.focusBase : this.secondaryBase;
    const officer = this.officers.partisan.bonus;
    const sentinel = this.details.focus !== "security" && this.officers.sentinel.actorId ? 1 : 0;
    const other = this.changes
      .filter((c) => ["allOrgChecks", "security"].includes(c.ability))
      .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
    const total = base + officer + sentinel + other;

    return { base, officer, sentinel, other, total };
  }

  async rollOrgCheck(orgCheckId, options = {}) {
    const check = this[orgCheckId];

    const parts = [];

    if (check.base) {
      parts.push(`${check.base}[${game.i18n.localize("PF1RS.Base")}]`);
    }
    if (check.officer) {
      parts.push(`${check.officer}[${game.i18n.localize(orgOfficers[orgCheckId])}]`);
    }
    if (check.sentinel) {
      parts.push(`${check.sentinel}[${game.i18n.localize("PF1RS.Sentinel")}]`);
    }

    // calculate other (changes)
    const changes = this.changes.filter((c) => ["allOrgChecks", orgCheckId].includes(c.ability));
    changes.forEach((c) => parts.push(`${c.bonus}[${c.parentName}: ${game.i18n.localize(changeTargets[c.ability])}]`));

    const label = game.i18n.localize(orgChecks[orgCheckId]);
    const token = options.token ?? this.token;

    const rollOptions = {
      ...options,
      parts,
      flavor: game.i18n.format("PF1RS.OrgCheckRoll", { check: label }),
      speaker: ChatMessage.implementation.getSpeaker({ actor: this, token, alias: token?.name }),
    };

    return await pf1.dice.d20Roll(rollOptions);
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
