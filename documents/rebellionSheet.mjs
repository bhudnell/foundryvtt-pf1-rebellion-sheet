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

    const data = {
      ...this.actor,
      isGM: game.user.isGM,
      checks: [
        {
          id: "loyalty",
          label: game.i18n.localize("PF1RS.Rebellion.Loyalty"),
          officerLabel: game.i18n.localize("PF1RS.Rebellion.Demagogue"),
        },
        {
          id: "secrecy",
          label: game.i18n.localize("PF1RS.Rebellion.Secrecy"),
          officerLabel: game.i18n.localize("PF1RS.Rebellion.Spymaster"),
        },
        {
          id: "security",
          label: game.i18n.localize("PF1RS.Rebellion.Security"),
          officerLabel: game.i18n.localize("PF1RS.Rebellion.Partisan"),
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
    data.itemTypes = actor.itemTypes;
    data.teams = data.itemTypes[rebellionTeamId] ?? [];
    data.events = data.itemTypes[rebellionEventId] ?? [];

    const eventChanges = this._prepareChanges(data.events);

    // indicators
    data.rankUpIndicator =
      getRankFromSupporters(actorData.details.supporters) > actorData.details.rank &&
      actorData.details.rank < actorData.details.maxRank;

    // details
    data.focusLabel = orgChecks[actorData.details.focus];

    // Organization checks
    for (const abl of data.checks) {
      abl.data = actorData[abl.id];
      abl.data.other = eventChanges
        .filter((c) => c.ability === abl.id || c.ability === "allOrgChecks")
        .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
      abl.data.total = abl.data.base + abl.data.officer + abl.data.sentinel + abl.data.other;
    }

    // available actions
    // TODO clicking action links to action's journal entry
    data.actions = {
      available: Object.entries(actions).map(([actionId, label]) => ({
        id: actionId,
        label: game.i18n.localize(label),
        available: alwaysAvailableActions.includes(actionId), // TODO check teams for more actions
      })),
      rank: maxActions[actorData.details.rank],
      strategist: actorData.officers.strategist.actorId ? 1 : 0,
    };

    // officers
    for (const officer of data.officers) {
      officer.actorId = actorData.officers[officer.id].actorId;
      officer.name = actorData.officers[officer.id].name;
      officer.bonus = actorData.officers[officer.id].bonus;
      officer.bonusType = game.i18n.localize(officerBonuses[officer.id]);
    }
    const officerChoices = { "": "" };
    game.actors
      .filter((actor) => actor.permission > 0 && (actor.type === "character" || actor.type === "npc"))
      .forEach((actor) => (officerChoices[actor.id] = actor.name));
    data.validOfficerChoices = officerChoices;

    // events
    data.danger =
      actorData.details.danger +
      eventChanges
        .filter((c) => c.ability === "danger")
        .reduce((total, c) => total + (c.mitigated ? Math.floor(c.bonus / 2) : c.bonus), 0);
    data.eventChance = Math.clamped(
      (actorData.details.notoriety + data.danger) * (actorData.doubleEventChance ? 2 : 1),
      10,
      95
    );

    return data;
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
