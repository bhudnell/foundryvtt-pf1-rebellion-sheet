import {
  CFG,
  actionCompendiumEntries,
  actions,
  itemSubTypes,
  maxActions,
  maxTeams,
  officerBonuses,
  orgChecks,
  orgOfficers,
  rebellionAllyId,
  rebellionEventId,
  rebellionTeamId,
  teamBaseTypes,
} from "../config.mjs";
import { getRankFromSupporters } from "../utils.mjs";

export class RebellionSheet extends ActorSheet {
  constructor(...args) {
    super(...args);

    this._expandedItems = new Set();
  }
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/actors/rebellion-sheet.hbs`,
      classes: [...options.classes, "rebellion", "actor"],
      tabs: [
        {
          navSelector: "nav.tabs[data-group='primary']",
          contentSelector: "section.primary-body",
          initial: "summary",
          group: "primary",
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
      enrichedNotes: await TextEditor.enrichHTML(actorData.notes),
      editable: this.isEditable,
      checks: [
        {
          id: "loyalty",
          label: game.i18n.localize("PF1RS.Loyalty"),
          officerLabel: game.i18n.localize("PF1RS.Demagogue"),
        },
        {
          id: "secrecy",
          label: game.i18n.localize("PF1RS.Secrecy"),
          officerLabel: game.i18n.localize("PF1RS.Spymaster"),
        },
        {
          id: "security",
          label: game.i18n.localize("PF1RS.Security"),
          officerLabel: game.i18n.localize("PF1RS.Partisan"),
        },
      ],
      officers: [
        {
          id: "demagogue",
          label: game.i18n.localize("PF1RS.Demagogue"),
        },
        {
          id: "partisan",
          label: game.i18n.localize("PF1RS.Partisan"),
        },
        {
          id: "recruiter",
          label: game.i18n.localize("PF1RS.Recruiter"),
        },
        {
          id: "sentinel",
          label: game.i18n.localize("PF1RS.Sentinel"),
        },
        {
          id: "spymaster",
          label: game.i18n.localize("PF1RS.Spymaster"),
        },
        {
          id: "strategist",
          label: game.i18n.localize("PF1RS.Strategist"),
        },
      ],
    };

    // item types
    data.teamSections = this._prepareTeams();
    data.teamType = rebellionTeamId;
    data.eventSections = this._prepareEvents();
    data.eventType = rebellionEventId;
    data.allies = actor.itemTypes[rebellionAllyId] ?? [];
    data.allyType = rebellionAllyId;

    // indicators
    data.rankUpIndicator =
      getRankFromSupporters(actorData.supporters) > actorData.rank && actorData.rank < actorData.maxRank;

    // details
    data.focusOptions = Object.fromEntries(
      Object.entries(orgChecks).map(([key, label]) => [key, game.i18n.localize(label)])
    );

    // Organization checks
    for (const abl of data.checks) {
      abl.data = actorData[abl.id];
    }

    // available actions
    data.actions = {
      available: Object.entries(actions).map(([actionId, label]) => ({
        ...actorData.actions[actionId],
        id: actionId,
        label: game.i18n.localize(label),
        compendiumEntry: actionCompendiumEntries[actionId],
        check: game.i18n.localize(orgChecks[actorData.actions[actionId].check]),
        showSafehouses: actionId === "ash",
      })),
      rank: maxActions[actorData.rank],
      strategist: actorData.officers.strategist.actorId ? 1 : 0,
    };

    // officers
    for (const officer of data.officers) {
      officer.actorId = actorData.officers[officer.id].actorId;
      officer.name = actorData.officers[officer.id].name;
      officer.bonus = actorData.officers[officer.id].bonus;
      officer.bonusType = game.i18n.localize(officerBonuses[officer.id]);
      officer.maxTeamsManaged = actorData.officers[officer.id].maxTeams;
      officer.currTeamsManaged = this.actor.itemTypes[rebellionTeamId].reduce(
        (total, t) => total + (t.system.managerId === officer.actorId ? 1 : 0),
        0
      );
    }
    const officerChoices = { "": "" };
    game.actors
      .filter((actor) => actor.permission > 0 && (actor.type === "character" || actor.type === "npc"))
      .forEach((actor) => (officerChoices[actor.id] = actor.name));
    data.validOfficerChoices = officerChoices;

    // teams
    data.teamCount = {
      active: data.teamSections[0].teams.length,
      levels: maxTeams[actorData.rank],
      bonus: 0,
      max: maxTeams[actorData.rank],
    };

    return data;
  }

  _prepareTeams() {
    const teams = this.actor.itemTypes[rebellionTeamId];
    const general = {
      label: game.i18n.localize("PF1RS.Teams.SubTypes.General"),
      subType: "general",
      showType: true,
      teams: [],
    };
    const unique = {
      label: game.i18n.localize("PF1RS.Teams.SubTypes.Unique"),
      subType: "unique",
      showType: false,
      teams: [],
    };
    teams.forEach((team) => {
      team.baseTypeLabel = game.i18n.localize(teamBaseTypes[team.system.baseType]);
      if (team.system.subType === general.subType) {
        general.teams.push(team);
      } else if (team.system.subType === unique.subType) {
        unique.teams.push(team);
      }
    });

    return [general, unique];
  }

  _prepareEvents() {
    const events = this.actor.itemTypes[rebellionEventId];
    const active = {
      label: game.i18n.localize("PF1RS.Events.SubTypes.Active"),
      subType: "active",
      showFlags: true,
      events: [],
    };
    const misc = {
      label: game.i18n.localize("PF1RS.Events.SubTypes.Misc"),
      subType: "misc",
      showFlags: false,
      events: [],
    };
    events.forEach((event) => {
      if (event.system.subType === active.subType) {
        active.events.push(event);
      } else if (event.system.subType === misc.subType) {
        misc.events.push(event);
      }
    });

    return [active, misc];
  }

  activateListeners(html) {
    super.activateListeners(html);

    html
      .find('input[name="system.rank"]')
      .on("change", (e) => this._validateMinMax(e, 1, this.actor.system.maxRank, undefined, "the max rank"));
    html
      .find('input[name="system.supporters"]')
      .on("change", (e) =>
        this._validateMinMax(e, 0, this.actor.system.population, undefined, "the current population")
      );

    html.find(".item-delete").on("click", (e) => this._onItemDelete(e));
    html.find(".item-toggle-data").on("click", (e) => this._itemToggleData(e));
    html.find(".item-edit").on("click", (e) => this._onItemEdit(e));
    html.find(".item-create").on("click", (e) => this._onItemCreate(e));
    html.find(".item .expand-summary").on("click", (e) => this._onItemSummary(e));

    html.find(".org-check .rollable").on("click", (e) => this._onRollOrgCheck(e));
    html.find(".eventChance .rollable").on("click", (e) => this._onRollEventChance(e));

    html.find("a.compendium-entry").on("click", (e) => this._onOpenCompendiumEntry(e));
    html.find("[data-tooltip-extended]").on("mouseenter", (e) => this._activateExtendedTooltip(e));
    html.find("[data-tooltip-extended]").on("mouseleave", () => game.tooltip.deactivate());
  }

  async _validateMinMax(e, min, max, minText, maxText) {
    const result = Number(e.target.value);

    if (result < min) {
      ui.notifications.warn(`Cant be lower than ${minText ?? min}`);
      e.target.value = min;
    } else if (result > max) {
      ui.notifications.warn(`Cant be higher than ${maxText ?? max}`);
      e.target.value = max;
    }
  }

  async _onItemDelete(event) {
    event.preventDefault();

    const button = event.currentTarget;
    if (button.disabled) {
      return;
    }

    const itemId = event.currentTarget.closest(".item").dataset.id;
    const item = this.actor.items.get(itemId);

    button.disabled = true;

    const msg = `<p>${game.i18n.localize("PF1.DeleteItemConfirmation")}</p>`;
    try {
      await Dialog.confirm({
        title: game.i18n.format("PF1.DeleteItemTitle", { name: item.name }),
        content: msg,
        yes: () => {
          item.delete();
          button.disabled = false;
        },
        no: () => (button.disabled = false),
        rejectClose: true,
      });
    } catch (e) {
      button.disabled = false;
    }
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

  async _onItemEdit(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.id;
    const item = this.document.items.get(itemId);

    item.sheet.render(true, { focus: true });
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;

    const type = header.dataset.type;
    const subType = header.dataset.subType;
    const typeName =
      (itemSubTypes[subType] ? `${game.i18n.localize(itemSubTypes[subType])} ` : "") +
      game.i18n.localize(CONFIG.Item.typeLabels[type] || type);

    const itemData = {
      name: game.i18n.format("PF1.NewItem", { type: typeName }),
      type,
      system: { subType },
    };

    const newItem = new Item(itemData);

    return this.actor.createEmbeddedDocuments("Item", [newItem.toObject()], { renderSheet: true });
  }

  async _onItemSummary(event) {
    event.preventDefault();
    const elem = event.target.closest(".item");
    const itemId = elem.dataset.id;
    const item = this.actor.items.get(itemId);

    if (this._expandedItems.has(itemId)) {
      const summary = elem.querySelector(".item-summary");
      $(summary).slideUp(200, () => summary.remove());

      this._expandedItems.delete(itemId);
    } else {
      const templateData = {
        description: item.system.description,
      };
      let content = await renderTemplate(`modules/${CFG.id}/templates/actors/parts/item-summary.hbs`, templateData);
      content = await TextEditor.enrichHTML(content);

      const div = $(content);

      div.hide();
      elem.append(...div);
      div.slideDown(200);

      this._expandedItems.add(itemId);
    }
  }

  async _onRollOrgCheck(event) {
    event.preventDefault();
    const orgCheck = event.currentTarget.closest(".org-check").dataset.orgcheck;
    this.actor.system.rollOrgCheck(orgCheck, { token: this.token, skipDialog: true });
  }

  async _onRollEventChance(event) {
    event.preventDefault();
    this.actor.system.rollEvent();
  }

  async _onOpenCompendiumEntry(event) {
    const uuid = event.currentTarget.dataset.compendiumEntry;

    const journal = await fromUuid(uuid);

    if (journal instanceof JournalEntryPage) {
      journal.parent.sheet.render(true, {
        pageId: journal.id,
        editable: false,
        collapsed: true,
        width: 600,
        height: 700,
      });
    } else {
      journal.sheet.render(true, { editable: false });
    }

    return journal;
  }

  async _activateExtendedTooltip(event) {
    const el = event.currentTarget;
    const [id, subId] = el.dataset.tooltipExtended.split(".");
    if (!id) {
      return;
    }

    const templateData = this._generateTooltipData(id, subId);

    if (!templateData.length) {
      return;
    }

    const text = await renderTemplate(`modules/${CFG.id}/templates/actors/parts/tooltip-content.hbs`, templateData);

    game.tooltip.activate(el, {
      text,
      cssClass: "rebellion",
    });
  }

  _generateTooltipData(id, subId) {
    const data = [];
    const actorData = this.actor.system;
    switch (id) {
      case "loyalty":
      case "security":
      case "secrecy": {
        const orgCheck = actorData[id];
        if (orgCheck.base) {
          data.push({ label: game.i18n.localize("PF1RS.Base"), value: orgCheck.base });
        }
        if (orgCheck.officer) {
          data.push({ label: game.i18n.localize(orgOfficers[id]), value: orgCheck.officer });
        }
        if (orgCheck.sentinel) {
          data.push({ label: game.i18n.localize("PF1RS.Sentinel"), value: orgCheck.sentinel });
        }
        if (id === "security" && actorData.safehouses) {
          data.push({ label: game.i18n.localize("PF1RS.Safehouses"), value: actorData.safehouses });
        }
        actorData.changes
          .filter((c) => c.ability && ["allOrgChecks", id].includes(c.ability))
          .forEach((c) => data.push({ label: c.parentName, value: c.mitigated ? Math.floor(c.bonus / 2) : c.bonus }));
        break;
      }
      case "danger": {
        if (actorData.danger.base) {
          data.push({ label: game.i18n.localize("PF1RS.Base"), value: actorData.danger.base });
        }
        actorData.changes
          .filter((c) => c.ability && [id].includes(c.ability))
          .forEach((c) => data.push({ label: c.parentName, value: c.mitigated ? Math.floor(c.bonus / 2) : c.bonus }));
        break;
      }
      case "action": {
        actorData.changes
          .filter((c) => c.ability && [subId].includes(c.ability))
          .forEach((c) => data.push({ label: c.parentName, value: c.mitigated ? Math.floor(c.bonus / 2) : c.bonus }));
        break;
      }
    }
    return data;
  }
}
