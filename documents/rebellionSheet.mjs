import {
  CFG,
  actions,
  alwaysAvailableActions,
  maxActions,
  officerBonuses,
  orgChecks,
  rebellionEventId,
  rebellionTeamId,
} from "../config.mjs";
import { getRankFromSupporters } from "../utils.mjs";

export class RebellionSheet extends ActorSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/rebellion-sheet.hbs`,
      classes: [...options.classes, "rebellion", "sheet"],
      dragDrop: [
        {
          dragSelector: ".item-list .item[data-item-id]",
          dropSelector: "form",
        },
      ],
    };
  }

  async getData() {
    const actor = this.actor;
    const actorData = actor.system;

    const officerActors = {
      demagogue: game.actors.get(this.actor.system.officers.demagogue.id),
      partisan: game.actors.get(this.actor.system.officers.partisan.id),
      recruiter: game.actors.get(this.actor.system.officers.recruiter.id),
      sentinel: game.actors.get(this.actor.system.officers.sentinel.id),
      spymaster: game.actors.get(this.actor.system.officers.spymaster.id),
      strategist: game.actors.get(this.actor.system.officers.strategist.id),
    };
    const context = {
      ...this.actor,
      isGM: game.user.isGM,
      checks: [
        {
          id: "loyalty",
          label: game.i18n.localize("PF1RS.Rebellion.Loyalty"),
          officerLabel: game.i18n.localize("PF1RS.Rebellion.Demagogue"),
          data: {
            base: actorData.details.focus === "loyalty" ? actorData.focusBase : actorData.secondaryBase,
            officer: this._prepareOfficerBonus("demagogue", officerActors.demagogue),
            sentinel: actorData.details.focus !== "loyalty" && actorData.officers.sentinel.id ? 1 : 0,
          },
        },
        {
          id: "secrecy",
          label: game.i18n.localize("PF1RS.Rebellion.Secrecy"),
          officerLabel: game.i18n.localize("PF1RS.Rebellion.Spymaster"),
          data: {
            base: actorData.details.focus === "secrecy" ? actorData.focusBase : actorData.secondaryBase,
            officer: this._prepareOfficerBonus("spymaster", officerActors.spymaster),
            sentinel: actorData.details.focus !== "secrecy" && actorData.officers.sentinel.id ? 1 : 0,
          },
        },
        {
          id: "security",
          label: game.i18n.localize("PF1RS.Rebellion.Security"),
          officerLabel: game.i18n.localize("PF1RS.Rebellion.Partisan"),
          data: {
            base: actorData.details.focus === "security" ? actorData.focusBase : actorData.secondaryBase,
            officer: this._prepareOfficerBonus("partisan", officerActors.partisan),
            sentinel: actorData.details.focus !== "security" && actorData.officers.sentinel.id ? 1 : 0,
          },
        },
      ],
      officers: [
        {
          id: "demagogue",
          label: game.i18n.localize("PF1RS.Rebellion.Demagogue"),
        },
        {
          id: "partisan",
          label: game.i18n.localize("PF1RS.Rebellion.Partisan"),
        },
        {
          id: "recruiter",
          label: game.i18n.localize("PF1RS.Rebellion.Recruiter"),
        },
        {
          id: "sentinel",
          label: game.i18n.localize("PF1RS.Rebellion.Sentinel"),
        },
        {
          id: "spymaster",
          label: game.i18n.localize("PF1RS.Rebellion.Spymaster"),
        },
        {
          id: "strategist",
          label: game.i18n.localize("PF1RS.Rebellion.Strategist"),
        },
      ],
    };

    // item types
    context.itemTypes = actor.itemTypes;
    context.teams = context.itemTypes[rebellionTeamId] ?? [];
    context.events = context.itemTypes[rebellionEventId] ?? [];

    const eventChanges = this._prepareChanges(context.events);

    // indicators
    context.rankUpIndicator =
      getRankFromSupporters(actorData.details.supporters) > actorData.details.rank &&
      actorData.details.rank < actorData.details.maxRank;

    // details
    context.focusLabel = orgChecks[actorData.details.focus];

    // Organization checks
    for (const abl of context.checks) {
      abl.data.other = eventChanges
        .filter((c) => c.ability === abl.id || c.ability === "allOrgChecks")
        .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
      abl.data.total = abl.data.base + abl.data.officer + abl.data.sentinel + abl.data.other;
    }

    // available actions
    context.actions = {
      available: Object.entries(actions).map(([actionId, label]) => ({
        id: actionId,
        label: game.i18n.localize(label),
        available: alwaysAvailableActions.includes(actionId), // TODO check teams for more actions
      })),
      rank: maxActions[actorData.details.rank],
      strategist: actorData.officers.strategist.id ? 1 : 0,
    };

    // officers
    for (const officer of context.officers) {
      officer.actorId = actorData.officers[officer.id].id;
      officer.name = officerActors[officer.id]?.name ?? "";
      officer.bonus = this._prepareOfficerBonus(officer.id, officerActors[officer.id]);
      officer.bonusType = game.i18n.localize(officerBonuses[officer.id]);
    }
    const officerChoices = { "": "" };
    game.actors
      .filter((actor) => actor.permission > 0 && (actor.type === "character" || actor.type === "npc"))
      .forEach((actor) => (officerChoices[actor.id] = actor.name));
    context.validOfficerChoices = officerChoices;

    // events
    context.danger =
      actorData.details.danger +
      eventChanges
        .filter((c) => c.ability === "danger")
        .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
    context.eventChance = Math.clamped(
      (actorData.details.notoriety + context.danger) * (actorData.doubleEventChance ? 2 : 1),
      10,
      95
    );

    return context;
  }

  _prepareChanges(items) {
    const changeItems = items.filter((item) => item.system.changes?.length > 0);

    const changes = [];
    for (const i of changeItems) {
      changes.push(
        ...i.system.changes.map((c) => ({
          ...c,
          parentId: i.id,
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

  _prepareOfficerBonus(name, actor) {
    if (!actor) {
      return 0;
    }

    switch (name) {
      case "demagogue":
        return Math.max(actor.system.abilities.con.mod, actor.system.abilities.cha.mod);
      case "partisan":
        return Math.max(actor.system.abilities.str.mod, actor.system.abilities.wis.mod);
      case "recruiter":
        return actor.system.attributes.hd.total;
      case "sentinel":
        return 1;
      case "spymaster":
        return Math.max(actor.system.abilities.dex.mod, actor.system.abilities.int.mod);
      case "strategist":
        return 1;
      default:
        return 0;
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    html
      .find('input[name="system.details.rank"]')
      .on("change", (e) => this._validateMinMax(e, 1, this.actor.system.details.maxRank, undefined, "the max rank"));
    html
      .find('input[name="system.details.supporters"]')
      .on("change", (e) =>
        this._validateMinMax(e, 0, this.actor.system.details.population, undefined, "the current population")
      );
    html.find(".item-delete").on("click", (e) => this._onItemDelete(e));
    html.find(".item-toggle-data").on("change", (e) => this._itemToggleData(e));
    html.find(".item-edit").on("click", (e) => this._onItemEdit(e));
  }

  _validateMinMax(e, min, max, minText, maxText) {
    const result = Number(e.target.value);

    if (result < min) {
      ui.notifications.warn(`Cant be lower than ${minText ?? min}`);
      e.target.value = min;
    } else if (result > max) {
      ui.notifications.warn(`Cant be higher than ${maxText ?? max}`);
      e.target.value = max;
    }
  }

  _onItemDelete(event) {
    event.preventDefault();

    const button = event.currentTarget;
    if (button.disabled) {
      return;
    }

    const itemId = event.currentTarget.closest(".item").dataset.id;
    const item = this.actor.items.get(itemId);

    button.disabled = true;

    const msg = `<p>${game.i18n.localize("PF1.DeleteItemConfirmation")}</p>`;
    Dialog.confirm({
      title: game.i18n.format("PF1.DeleteItemTitle", { name: item.name }),
      content: msg,
      yes: () => {
        item.delete();
        button.disabled = false;
      },
      no: () => (button.disabled = false),
      rejectClose: true,
    }).then(null, () => (button.disabled = false));
  }

  async _itemToggleData(event) {
    event.preventDefault();
    const el = event.currentTarget;

    const itemId = el.closest(".item").dataset.id;
    const item = this.actor.items.get(itemId);
    const property = el.dataset.name;

    const updateData = { system: {} };
    foundry.utils.setProperty(updateData.system, property, !foundry.utils.getProperty(item.system, property));

    item.update(updateData);
  }

  _onItemEdit(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.id;
    const item = this.document.items.get(itemId);

    item.sheet.render(true, { focus: true });
  }
}
