import {
  CFG,
  actionCompendiumEntries,
  actions,
  maxActions,
  maxTeams,
  officerBonuses,
  orgChecks,
  rebellionAllyId,
  rebellionEventId,
  rebellionTeamId,
  teamTypes,
} from "../config.mjs";
import { getRankFromSupporters } from "../utils.mjs";

// TODO track safehouses +1 security for each max +5
/* TODO rolls:
- notoriety: d100 <= notoriety score
- supporter attrition: DC 10 Loyalty On success lose 1d6 supporters. If nat 20, gain 1d6 supporters. On failed lose 2d4 + rank supporters.
- notoriety max: notoriety = 100 lose 1d20 + rank supporters and pop
- treasury shortage: treasury < min lose 2d4 + rank supporters
*/
// TODO strip more stuff out of unpacked compendia

export class RebellionSheet extends ActorSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/rebellion-sheet.hbs`,
      classes: [...options.classes, "rebellion", "sheet"],
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
    data.events = actor.itemTypes[rebellionEventId] ?? [];
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
    // TODO move below to team sheet (or figure out how to update team item from here)
    const managerChoices = { "": "" };
    data.officers.forEach((officer) => (managerChoices[officer.actorId] = officer.name));
    data.validManagerChoices = managerChoices;

    return data;
  }

  _prepareTeams() {
    const teams = this.actor.itemTypes[rebellionTeamId];
    const general = {
      label: game.i18n.localize("PF1RS.Teams.SubTypes.General"),
      subType: "general",
      teams: [],
    };
    const unique = {
      label: game.i18n.localize("PF1RS.Teams.SubTypes.Unique"),
      subType: "unique",
      teams: [],
    };
    teams.forEach((team) => {
      team.typeLabel = game.i18n.localize(teamTypes[team.system.type]);
      if (team.system.subType === general.subType) {
        general.teams.push(team);
      } else if (team.system.subType === unique.subType) {
        unique.teams.push(team);
      }
    });

    return [general, unique];
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

    html.find(".org-check .rollable").on("click", (e) => this._onRollOrgCheck(e));
    html.find(".eventChance .rollable").on("click", (e) => this._onRollEventChance(e));

    html.find("a.compendium-entry").on("click", (e) => this._onOpenCompendiumEntry(e));
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
    const typeName = game.i18n.localize(CONFIG.Item.typeLabels[type] || type);

    const itemData = {
      name: game.i18n.format("PF1.NewItem", { type: typeName }),
      type,
      system: { subType },
    };

    const newItem = new Item(itemData);

    return this.actor.createEmbeddedDocuments("Item", [newItem.toObject()], { renderSheet: true });
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
}
