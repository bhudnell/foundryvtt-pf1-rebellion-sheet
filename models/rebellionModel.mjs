import { CFG, changeTargets, maxActions, maxTeams, orgCheckOfficer, orgChecks, orgOfficers } from "../config.mjs";

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
        recruiter: new fields.EmbeddedDataField(defineOfficer("recruiter")),
        sentinel: new fields.EmbeddedDataField(defineOfficer("sentinel")),
        spymaster: new fields.EmbeddedDataField(defineOfficer("spymaster")),
        strategist: new fields.EmbeddedDataField(defineOfficer("strategist")),
      }),
      doubleEventChance: new fields.BooleanField({ initial: false }),
    };
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

    for (const check of Object.keys(orgChecks)) {
      this[check].base += this.focus === check ? focusBase : secondaryBase;
      this[check].officer += this.officers[orgCheckOfficer[check]].bonus;
      this[check].sentinel += this.focus !== check && this.officers.sentinel.actorId ? 1 : 0;
      this[check].other += this.changes
        .filter((c) => ["allOrgChecks", check].includes(c.ability))
        .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
      this[check].total += this[check].base + this[check].officer + this[check].sentinel + this[check].other;
    }

    // other details
    this.minTreasury = this.rank * 10;
    this.maxActions = maxActions[this.rank] + (this.officers.strategist.actorId ? 1 : 0);
    this.maxTeams = maxTeams[this.rank];

    this.danger.other += this.changes
      .filter((c) => c.ability === "danger")
      .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
    this.danger.total = this.danger.base + this.danger.other;
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
      speaker: ChatMessage.getSpeaker({ actor: this, token, alias: token?.name }),
    };

    return await pf1.dice.d20Roll(rollOptions);
  }

  async rollEvent(options = {}) {
    const eventChance = Math.clamped((this.notoriety + this.danger) * (this.doubleEventChance ? 2 : 1), 10, 95);

    const roll = new pf1.dice.RollPF("1d100");

    await roll.evaluate();

    const eventOccurred = roll.total <= eventChance;

    const token = options.token ?? this.token;

    const templateData = {
      flavor: game.i18n.localize("PF1RS.EventChance"),
      formula: roll.formula,
      natural: roll.total,
      bonus: 0,
      total: roll.total,
      tooltip: await roll.getTooltip(),
      eventOccurred,
    };

    const messageData = {
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: options.noSound ? undefined : CONFIG.sounds.dice,
      content: await renderTemplate(`modules/${CFG.id}/templates/event-roll.hbs`, templateData),
      speaker: ChatMessage.getSpeaker({ actor: this, token, alias: token?.name }),
      flags: {},
    };
    messageData.flags[CFG.id] = { eventChanceCard: true };

    await ChatMessage.create(messageData);
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
