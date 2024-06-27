import {
  CFG,
  actions,
  allChangeTargets,
  alwaysAvailableActions,
  maxActions,
  maxTeams,
  orgCheckOfficer,
  orgChecks,
  orgOfficers,
} from "../config.mjs";

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
      notes: new fields.HTMLField(),
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
      this[check].other += this._getChanges(["allOrgChecks", check]);

      if (check === "security") {
        this[check].other += Math.min(5, this.safehouses);
      }

      this[check].total += this[check].base + this[check].officer + this[check].sentinel + this[check].other;
    }

    // actions
    const itemActions = this._getItemActions();
    for (const action of Object.keys(actions)) {
      this.actions[action].changeBonus = this._getChanges(action);
      this.actions[action].available = alwaysAvailableActions.includes(action) || itemActions.has(action);
      this.actions[action].sources = itemActions.get(action);
    }

    // other details
    this.minTreasury = this.rank * 10;
    this.maxActions = maxActions[this.rank] + (this.officers.strategist.actorId ? 1 : 0);
    this.maxTeams = maxTeams[this.rank];

    this.danger.other += this._getChanges("danger");
    this.danger.total = this.danger.base + this.danger.other;

    this.eventChance = Math.clamped((this.notoriety + this.danger.total) * (this.doubleEventChance ? 2 : 1), 10, 95);
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
    changes.forEach((c) =>
      parts.push(`${c.bonus}[${c.parentName}: ${game.i18n.localize(allChangeTargets[c.ability])}]`)
    );

    const label = game.i18n.localize(orgChecks[orgCheckId]);
    const actor = options.actor ?? this.actor;
    const token = options.token ?? this.token;

    const rollOptions = {
      ...options,
      parts,
      flavor: game.i18n.format("PF1RS.OrgCheckRoll", { check: label }),
      speaker: ChatMessage.getSpeaker({ actor, token, alias: token?.name }),
    };

    return await pf1.dice.d20Roll(rollOptions);
  }

  async rollEvent(options = {}) {
    const roll = new pf1.dice.RollPF("1d100");

    await roll.evaluate();

    const eventOccurred = roll.total <= this.eventChance;

    const actor = options.actor ?? this.actor;
    const token = options.token ?? this.token;

    const templateData = {
      label: game.i18n.format("PF1RS.EventChanceRoll", { chance: this.eventChance }),
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
      content: await renderTemplate(`modules/${CFG.id}/templates/chat/event-roll.hbs`, templateData),
      speaker: ChatMessage.getSpeaker({ actor, token, alias: token?.name }),
      flags: { [CFG.id]: { eventChanceCard: true } },
    };

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

  _getItemActions() {
    const actionItems = this.parent.items.filter(
      (item) => !item.system.disabled && !item.system.missing && item.system.actions?.value.length > 0
    );
    const actions = new Map();

    for (const item of actionItems) {
      for (const action of item.system.actions.value) {
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
}

function defineAction(check) {
  const fields = foundry.data.fields;

  return new fields.SchemaField({
    check: new fields.StringField({
      initial: check,
      nullable: true,
      choices: Object.keys(orgChecks),
    }),
  });
}

function defineOfficer(type) {
  return class OfficerModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
      const fields = foundry.data.fields;

      return {
        actorId: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
      };
    }

    _initialize(...args) {
      super._initialize(...args);

      this.type = type;
      this.id = foundry.utils.randomID();
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

      switch (this.type) {
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

    get maxTeams() {
      const officer = game.actors.get(this.actorId);

      if (!officer) {
        return 0;
      }

      const hasNbl = officer.itemTypes.feat.some(
        (i) => i.name.includes("Natural Born Leader") && i.system.subType === "trait"
      );

      const chaMod = hasNbl ? Math.max(2, officer.system.abilities.cha.mod + 1) : officer.system.abilities.cha.mod;

      return Math.max(0, chaMod);
    }
  };
}
