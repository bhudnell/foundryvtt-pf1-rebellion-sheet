import { buffTargets } from "../../config/buffTargets.mjs";
import { DefaultChange } from "../../util/utils.mjs";

import { BaseActor } from "./baseActor.mjs";

export class RebellionActor extends BaseActor {
  prepareDerivedData() {
    super.prepareDerivedData();

    // actions
    for (const action of Object.keys(pf1rs.config.actions)) {
      this.system.actions[action].available =
        pf1rs.config.alwaysAvailableActions.includes(action) || this.rActions.has(action);
      this.system.actions[action].sources = this.rActions.get(action);
    }

    // event chance
    this.system.eventChance = Math.clamped(
      (this.system.notoriety + this.system.danger.total) * (this.system.doubleEventChance ? 2 : 1),
      10,
      95
    );
  }

  async rollOrgCheck(orgCheckId, options = {}) {
    const parts = [];
    const props = [];

    const changes = pf1.documents.actor.changes.getHighestChanges(
      this.changes.filter(
        (c) => c.operator !== "set" && c.target === `${pf1rs.config.changePrefix}_${orgCheckId}` && c.value
      ),
      { ignoreTarget: true }
    );

    for (const c of changes) {
      parts.push(`${c.value}[${c.flavor}]`);
    }

    // Add context notes
    const rollData = options.rollData || this.getRollData();
    const noteObjects = this.getContextNotes(`${pf1rs.config.changePrefix}_${orgCheckId}`);
    const notes = this.formatContextNotes(noteObjects, rollData);
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
      tooltip: await roll.getTooltip(),
      eventOccurred,
    };

    const messageData = {
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: options.noSound ? undefined : CONFIG.sounds.dice,
      content: await renderTemplate(`modules/${pf1rs.config.moduleId}/templates/chat/event-roll.hbs`, templateData),
      speaker: ChatMessage.getSpeaker({ actor, token, alias: token?.name }),
      flags: { [pf1rs.config.moduleId]: { eventChanceCard: true } },
    };

    await ChatMessage.create(messageData);
  }

  _addDefaultChanges(changes) {
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

  _setSourceDetails() {
    // Get empty source arrays
    const sourceDetails = {};
    for (const b of Object.keys(buffTargets)) {
      const buffTargets = pf1.documents.actor.changes.getChangeFlat.call(this, b, null);
      for (const bt of buffTargets) {
        if (!sourceDetails[bt]) {
          sourceDetails[bt] = [];
        }
      }
    }

    for (const stat of [...Object.keys(pf1rs.config.orgChecks), "danger"]) {
      sourceDetails[`system.${stat}.total`].push({
        name: game.i18n.localize("PF1.Base"),
        value: this.system[stat].base,
      });
    }

    // Add extra data
    const rollData = this.getRollData();
    for (const [path, changeGrp] of Object.entries(this.sourceInfo)) {
      /** @type {Array<SourceInfo[]>} */
      const sourceGroups = Object.values(changeGrp);
      for (const grp of sourceGroups) {
        sourceDetails[path] ||= [];
        for (const src of grp) {
          src.operator ||= "add";
          const label = this.constructor._getSourceLabel(src);
          let srcValue =
            src.value ??
            pf1.dice.RollPF.safeRollAsync(src.formula || "0", rollData, [path, src, this], {
              suppressError: !this.isOwner,
            }).total;
          if (src.operator === "set") {
            let displayValue = srcValue;
            if (src.change?.isDistance) {
              displayValue = pf1.utils.convertDistance(displayValue)[0];
            }
            srcValue = game.i18n.format("PF1.SetTo", { value: displayValue });
          }

          // Add sources only if they actually add something else than zero
          if (!(src.operator === "add" && srcValue === 0) || src.ignoreNull === false) {
            sourceDetails[path].push({
              name: label.replace(/[[\]]/g, ""),
              modifier: src.modifier || "",
              value: srcValue,
            });
          }
        }
      }
    }

    this.sourceDetails = sourceDetails;
  }
}
