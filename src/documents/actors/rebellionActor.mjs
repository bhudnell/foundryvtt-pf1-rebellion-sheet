import { buffTargets } from "../../config/buffTargets.mjs";
import { DefaultChange } from "../../util/utils.mjs";

import { BaseActor } from "./baseActor.mjs";

export class RebellionActor extends BaseActor {
  prepareDerivedData() {
    super.prepareDerivedData();

    // actions
    for (const action of Object.keys(pf1rs.config.actions)) {
      this.system.actions[action].alwaysAvailable = pf1rs.config.alwaysAvailableActions.includes(action);
      this.system.actions[action].sources = this.rActions.get(action);
    }

    // event chance
    this.system.eventChance = Math.clamp(
      (this.system.notoriety + this.system.danger.total) * (this.system.doubleEventChance ? 2 : 1),
      10,
      95
    );
  }

  async rollOrgCheck(orgCheckId, options = {}) {
    const parts = [];
    const props = [];

    parts.push(`${this.system[orgCheckId].base}[${game.i18n.localize("PF1.Base")}]`);

    const changes = pf1.documents.actor.changes.getHighestChanges(
      this.changes.filter(
        (c) => c.operator !== "set" && c.getTargets(this).includes(`system.${orgCheckId}.total`) && c.value
      ),
      { ignoreTarget: true }
    );

    for (const c of changes) {
      parts.push(`${c.value}[${c.flavor}]`);
    }

    // Add context notes
    const rollData = options.rollData || this.getRollData();
    const notes = await this.getContextNotesParsed(`${pf1rs.config.changePrefix}_${orgCheckId}`, { rollData });
    if (notes.length > 0) {
      props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });
    }

    const label = pf1rs.config.orgChecks[orgCheckId];
    const actor = options.actor ?? this;
    const token = options.token ?? this.token;

    const rollOptions = {
      ...options,
      parts,
      rollData,
      flavor: game.i18n.format("PF1RS.OrgCheckRoll", { check: label }),
      chatTemplateData: { properties: props },
      speaker: ChatMessage.getSpeaker({ actor, token, alias: token?.name }),
    };

    return await pf1.dice.d20Roll(rollOptions);
  }

  async rollAction(actionId, options = {}) {
    const action = this.system.actions[actionId];

    const parts = [];
    const props = [];

    const orgCheck = action.check;
    parts.push(`${this.system[orgCheck].total}[${pf1rs.config.orgChecks[orgCheck]}]`);

    const changes = pf1.documents.actor.changes.getHighestChanges(
      this.changes.filter(
        (c) => c.operator !== "set" && c.target === `${pf1rs.config.changePrefix}_${actionId}` && c.value
      ),
      { ignoreTarget: true }
    );

    for (const c of changes) {
      parts.push(`${c.value}[${c.flavor}]`);
    }

    // Add context notes
    const rollData = options.rollData || this.getRollData();
    const notes = await this.getContextNotesParsed(`${pf1rs.config.changePrefix}_${actionId}`, { rollData });
    if (notes.length > 0) {
      props.push({ header: game.i18n.localize("PF1.Notes"), value: notes });
    }

    let sourceId = action.sources?.[0].id;
    // if more than 1 source (action.sources + in always available actions) open dialog to choose
    if (action.sources?.length > (action.alwaysAvailable ? 0 : 1)) {
      const content = await renderTemplate(`modules/${pf1rs.config.moduleId}/templates/dialog/team-picker.hbs`, {
        defaultSource: action.alwaysAvailable,
        sources: action.sources,
      });
      const response = await Dialog.prompt({
        title: game.i18n.localize("PF1RS.SelectTeam"),
        content,
        label: game.i18n.localize("PF1.Roll"),
        callback: (html) => {
          const form = html[0].querySelector("form");
          const formData = foundry.utils.expandObject(new FormDataExtended(form).object);
          sourceId = formData.team;
        },
        options: { classes: ["dialog", "rebellion"] },
      });

      if (!response) {
        return;
      }
    }

    const source = this.getEmbeddedDocument("Item", sourceId);
    const bonus = source?.system.bonus ?? 0;
    const tier = source?.system.tier ?? 0;

    if (bonus) {
      parts.push(`${bonus}[${source.name}]`);
    }

    if (actionId === "gi" && tier) {
      parts.push(`${tier * 2}[${source.name} (${game.i18n.localize("PF1.Tier")})]`);
    }

    const label = pf1rs.config.actions[actionId];
    const actor = options.actor ?? this;
    const token = options.token ?? this.token;

    const rollOptions = {
      ...options,
      parts,
      rollData,
      flavor: game.i18n.format("PF1RS.ActionRoll", { action: label }),
      chatTemplateData: { properties: props },
      speaker: ChatMessage.getSpeaker({ actor, token, alias: token?.name }),
    };

    return await pf1.dice.d20Roll(rollOptions);
  }

  async rollEvent(options = {}) {
    const roll = new pf1.dice.RollPF("1d100");

    await roll.evaluate();

    const eventOccurred = roll.total <= this.system.eventChance;

    const actor = options.actor ?? this;
    const token = options.token ?? this.token;

    const templateData = {
      label: game.i18n.format("PF1RS.EventChanceRoll", { chance: this.system.eventChance }),
      formula: roll.formula,
      natural: roll.total,
      bonus: 0,
      total: roll.total,
      details: await roll.getTooltip(),
      eventOccurred,
    };

    const messageData = {
      type: "check",
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      rolls: [roll],
      sound: options.noSound ? undefined : CONFIG.sounds.dice,
      content: await renderTemplate(`modules/${pf1rs.config.moduleId}/templates/chat/event-roll.hbs`, templateData),
      speaker: ChatMessage.getSpeaker({ actor, token, alias: token?.name }),
      flags: { [pf1rs.config.moduleId]: { eventChanceCard: true } },
    };

    await ChatMessage.create(messageData);
  }

  _prepareTypeChanges(changes) {
    const system = this.system;

    // org checks
    for (const check of Object.keys(pf1rs.config.orgChecks)) {
      changes.push(
        new DefaultChange(
          this.system.officers[pf1rs.config.orgCheckOfficer[check]].bonus,
          `${pf1rs.config.changePrefix}_${check}`,
          pf1rs.config.orgOfficers[check]
        )
      );

      if (this.system.focus !== check && this.system.officers.sentinel.actorId) {
        changes.push(
          new DefaultChange(1, `${pf1rs.config.changePrefix}_${check}`, game.i18n.localize("PF1RS.Sentinel"))
        );
      }

      if (check === "security" && this.system.safehouses) {
        changes.push(
          new DefaultChange(
            Math.min(5, this.system.safehouses),
            `${pf1rs.config.changePrefix}_${check}`,
            game.i18n.localize("PF1RS.Safehouses")
          )
        );
      }
    }
  }

  _prepareRActions() {
    const actions = [];

    for (const item of this.items) {
      if (item.type.startsWith(`${pf1rs.config.moduleId}.`) && item.hasRActions && item.isActive) {
        actions.push(...item.rActions);
      }
    }

    const a = new Collection();
    for (const action of actions) {
      const prior = a.get(action.key);
      a.set(action.key, [...(prior ?? []), action.source]);
    }

    this.rActions = a;
  }

  getSourceDetails(path) {
    const sources = super.getSourceDetails(path);

    const attrRE = /^system\.(?<attr>\w+)\.total$/.exec(path);
    if (attrRE) {
      const { attr } = attrRE.groups;

      if ([...Object.keys(pf1rs.config.orgChecks), "danger"].includes(attr)) {
        sources.push({
          name: game.i18n.localize("PF1.Base"),
          value: this.system[attr].base,
        });
      }
    }

    return sources;
  }
}
