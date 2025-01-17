import { getRankFromSupporters } from "../../util/utils.mjs";

export class RebellionSheet extends pf1.applications.actor.ActorSheetPF {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      classes: [...options.classes, "rebellion"],
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

  get template() {
    return `modules/${pf1rs.config.moduleId}/templates/actors/rebellion/${this.isEditable ? "edit" : "view"}.hbs`;
  }

  async getData() {
    const actor = this.actor;
    const actorData = actor.system;
    const isOwner = actor.isOwner;

    const data = {
      ...this.actor,
      isGM: game.user.isGM,
      owner: isOwner,
      enrichedNotes: await TextEditor.enrichHTML(actorData.notes.value ?? "", {
        rolldata: actor.getRollData(),
        async: true,
        secrets: this.object.isOwner,
        relativeTo: this.actor,
      }),
      editable: this.isEditable,
      cssClass: isOwner ? "editable" : "locked",
    };

    // item types
    data.teamSections = this._prepareTeams();
    data.teamType = pf1rs.config.teamId;
    data.eventSections = this._prepareEvents();
    data.eventType = pf1rs.config.eventId;
    data.allies = actor.itemTypes[pf1rs.config.allyId] ?? [];
    data.allyType = pf1rs.config.allyId;

    // indicators
    data.rankUpIndicator =
      getRankFromSupporters(actorData.supporters) > actorData.rank && actorData.rank < actorData.maxRank;

    // details
    data.focusOptions = Object.fromEntries(
      Object.entries(pf1rs.config.orgChecks).map(([key, label]) => [key, game.i18n.localize(label)])
    );

    // Organization checks
    data.checks = [];
    for (const [id, label] of Object.entries(pf1rs.config.orgChecks)) {
      data.checks.push({ id, label, value: actorData[id] });
    }

    // available actions
    data.actions = {
      available: Object.entries(pf1rs.config.actions).map(([actionId, label]) => ({
        ...actorData.actions[actionId],
        id: actionId,
        label: game.i18n.localize(label),
        compendiumEntry: pf1rs.config.actionCompendiumEntries[actionId],
        check: game.i18n.localize(pf1rs.config.orgChecks[actorData.actions[actionId].check]),
        showSafehouses: actionId === "ash",
      })),
      rank: pf1rs.config.maxActions[actorData.rank],
      strategist: actorData.officers.strategist.actorId ? 1 : 0,
    };

    // non-recruiter officers
    data.officers = Object.entries(actorData.officers).reduce((acc, [id, officer]) => {
      if (id === "recruiters") {
        return acc;
      }

      acc.push({
        id,
        label: pf1rs.config.officerRoles[id],
        actorId: officer.actorId,
        bonus: officer.bonus,
        bonusType: pf1rs.config.officerBonuses[id],
        currTeamsManaged: this.actor.itemTypes[pf1rs.config.teamId].reduce(
          (total, t) => total + (t.system.managerId === officer.actorId ? 1 : 0),
          0
        ),
        maxTeamsManaged: officer.maxTeams,
      });

      return acc;
    }, []);

    // recruiter officers
    data.recruiters = actorData.officers.recruiters.map((recruiter, idx) => {
      return {
        id: recruiter.id,
        label: pf1rs.config.officerRoles.recruiter,
        canDelete: idx > 0,
        actorId: recruiter.actorId,
        name: recruiter.name,
        bonus: recruiter.bonus,
        bonusType: pf1rs.config.officerBonuses.recruiter,
        maxTeamsManaged: recruiter.maxTeams,
        currTeamsManaged: this.actor.itemTypes[pf1rs.config.teamId].reduce(
          (total, t) => total + (t.system.managerId === recruiter.actorId ? 1 : 0),
          0
        ),
      };
    });

    const officerOptions = { "": "" };
    game.actors
      .filter((actor) => actor.permission > 0 && (actor.type === "character" || actor.type === "npc"))
      .forEach((actor) => (officerOptions[actor.id] = actor.name));
    data.validOfficerOptions = officerOptions;

    // teams
    data.teamCount = {
      active: data.teamSections[0].teams.length,
      levels: pf1rs.config.maxTeams[actorData.rank],
      bonus: 0,
      max: pf1rs.config.maxTeams[actorData.rank],
    };

    return data;
  }

  _prepareTeams() {
    const teams = this.actor.itemTypes[pf1rs.config.teamId];
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
      team.baseTypeLabel = game.i18n.localize(pf1rs.config.teamBaseTypes[team.system.baseType]);
      if (team.system.subType === general.subType) {
        general.teams.push(team);
      } else if (team.system.subType === unique.subType) {
        unique.teams.push(team);
      }
    });

    return [general, unique];
  }

  _prepareEvents() {
    const events = this.actor.itemTypes[pf1rs.config.eventId];
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

    html.find(".recruiter-create").on("click", (e) => this._onRecruiterCreate(e));
    html.find(".recruiter-delete").on("click", (e) => this._onRecruiterDelete(e));

    html.find(".item-toggle-data").on("click", (e) => this._itemToggleData(e));

    html.find(".org-check .rollable").on("click", (e) => this._onRollOrgCheck(e));
    html.find(".event-chance .rollable").on("click", (e) => this._onRollEventChance(e));
  }

  async _onRecruiterCreate(event) {
    event.preventDefault();

    const recruiters = foundry.utils.deepClone(this.actor.system.officers.recruiters ?? []);
    recruiters.push({
      actorId: null,
      type: "recruiter",
      id: foundry.utils.randomID(),
    });
    await this._onSubmit(event, {
      updateData: { "system.officers.recruiters": recruiters },
    });
  }

  async _onRecruiterDelete(event) {
    event.preventDefault();

    const recruiterId = event.currentTarget.closest(".item").dataset.id;

    const recruiters = foundry.utils.deepClone(this.actor.system.officers.recruiters ?? []);
    recruiters.findSplice((recruiter) => recruiter.id === recruiterId);

    return this._onSubmit(event, {
      updateData: { "system.officers.recruiters": recruiters },
    });
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

  async _onRollOrgCheck(event) {
    event.preventDefault();
    const orgCheck = event.currentTarget.closest(".org-check").dataset.orgCheck;
    this.actor.rollOrgCheck(orgCheck, { actor: this.actor, skipDialog: true });
  }

  async _onRollEventChance(event) {
    event.preventDefault();
    this.actor.rollEvent({ actor: this.actor });
  }

  // overrides
  _focusTabByItem(item) {
    let tabId;
    switch (item.type) {
      case pf1rs.config.teamId:
        tabId = "teams";
        break;
      case pf1rs.config.eventId:
        tabId = "events";
        break;
      case pf1rs.config.allyId:
        tabId = "allies";
        break;
      default:
        tabId = "summary";
    }

    if (tabId) {
      this.activateTab(tabId, "primary");
    }
  }

  _getTooltipContext(fullId, context) {
    const actor = this.actor;
    const actorData = actor.system;

    // Lazy roll data
    const lazy = {
      get rollData() {
        this._rollData ??= actor.getRollData();
        return this._rollData;
      },
    };

    const getSource = (path) => this.actor.sourceDetails[path];

    const getNotes = (context) => {
      const noteObjs = actor.getContextNotes(context);
      return actor.formatContextNotes(noteObjs, lazy.rollData, { roll: false });
    };

    let header, subHeader;
    const details = [];
    const paths = [];
    const sources = [];
    let notes;

    const re = /^(?<id>[\w-]+)(?:\.(?<detail>.*))?$/.exec(fullId);
    const { id, detail } = re?.groups ?? {};

    // TODO all the tooltips
    switch (id) {
      case "consumption":
        paths.push({
          path: `@${id}.total`,
          value: actorData[id].total,
        });
        sources.push({
          sources: getSource(`system.${id}.total`),
          untyped: true,
        });
        notes = getNotes(`${pf1rs.config.changePrefix}_${id}`);
        break;

      default:
        throw new Error(`Invalid extended tooltip identifier "${fullId}"`);
    }

    context.header = header;
    context.subHeader = subHeader;
    context.details = details;
    context.paths = paths;
    context.sources = sources;
    context.notes = notes ?? [];
  }
}
