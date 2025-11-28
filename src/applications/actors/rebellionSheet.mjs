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

    data.sections = this._prepareItems();

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
        available: actorData.actions[actionId].alwaysAvailable || actor.rActions.has(actionId),
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
      active: data.sections.teams[0].items?.length ?? 0,
      levels: pf1rs.config.maxTeams[actorData.rank],
      bonus: 0,
      max: pf1rs.config.maxTeams[actorData.rank],
    };

    return data;
  }

  _prepareItems() {
    const items = this.actor.items.map((i) => i).sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const [teams, events, allies] = items.reduce(
      (arr, item) => {
        if (item.type === pf1rs.config.teamId) {
          arr[0].push(item);
        } else if (item.type === pf1rs.config.eventId) {
          arr[1].push(item);
        } else {
          arr[2].push(item);
        }
        return arr;
      },
      [[], [], []]
    );

    const teamsSections = Object.values(pf1.config.sheetSections.rebellionTeam).map((data) => ({ ...data }));
    for (const i of teams) {
      const section = teamsSections.find((section) => this._applySectionFilter(i, section));
      if (section) {
        section.items ??= [];
        section.items.push({ ...i, id: i.id, teamType: pf1rs.config.teamBaseTypes[i.system.baseType] });
      }
    }

    const eventsSections = Object.values(pf1.config.sheetSections.rebellionEvent).map((data) => ({ ...data }));
    for (const i of events) {
      const section = eventsSections.find((section) => this._applySectionFilter(i, section));
      if (section) {
        section.items ??= [];
        section.items.push(i);
      }
    }

    const alliesSections = Object.values(pf1.config.sheetSections.rebellionAlly).map((data) => ({ ...data }));
    for (const i of allies) {
      const section = alliesSections.find((section) => this._applySectionFilter(i, section));
      if (section) {
        section.items ??= [];
        section.items.push(i);
      }
    }

    const categories = [
      { key: "teams", sections: teamsSections },
      { key: "events", sections: eventsSections },
      { key: "allies", sections: alliesSections },
    ];

    for (const { key, sections } of categories) {
      const set = this._filters.sections[key];
      for (const section of sections) {
        if (!section) {
          continue;
        }
        section._hidden = set?.size > 0 && !set.has(section.id);
      }
    }

    return { teams: teamsSections, events: eventsSections, allies: alliesSections };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".recruiter-create").on("click", (e) => this._onRecruiterCreate(e));
    html.find(".recruiter-delete").on("click", (e) => this._onRecruiterDelete(e));

    html.find(".item-toggle-data").on("click", (e) => this._itemToggleData(e));

    html.find(".org-check .rollable").on("click", (e) => this._onRollOrgCheck(e));
    html.find(".skill .action.roll:not(.disabled)").on("click", (e) => this._onRollAction(e));
    html.find(".event-chance .rollable").on("click", (e) => this._onRollEventChance(e));
  }

  async _onRecruiterCreate(event) {
    event.preventDefault();

    const recruiters = foundry.utils.duplicate(this.actor.system.officers.recruiters ?? []);
    recruiters.push({
      role: "recruiter",
    });

    await this._onSubmit(event, {
      updateData: { "system.officers.recruiters": recruiters },
    });
  }

  async _onRecruiterDelete(event) {
    event.preventDefault();

    const recruiterId = event.currentTarget.closest(".item").dataset.itemId;
    const recruiters = foundry.utils.duplicate(this.actor.system.officers.recruiters ?? []);
    recruiters.findSplice((recruiter) => recruiter.id === recruiterId);

    const button = event.currentTarget;
    if (button.disabled) {
      return;
    }
    button.disabled = true;

    const confirm = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("PF1RS.RemoveRecruiter"), icon: "fa-solid fa-trash" },
      classes: ["pf1-v2", "delete-item", "pf1rs"],
      content: `<p>${game.i18n.localize("PF1RS.RemoveRecruiterConfirmation")}</p>`,
      rejectClose: false,
      modal: true, // Require dialog to be resolved
    });

    if (confirm) {
      this._onSubmit(event, {
        updateData: { "system.officers.recruiters": recruiters },
      });
    }

    button.disabled = false;
  }

  async _itemToggleData(event) {
    event.preventDefault();
    const el = event.currentTarget;

    const itemId = el.closest(".item").dataset.itemId;
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

  async _onRollAction(event) {
    event.preventDefault();
    const actionId = event.currentTarget.closest(".skill").dataset.actionId;
    this.actor.rollAction(actionId, { actor: this.actor, skipDialog: true });
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

  async _getTooltipContext(fullId, context) {
    const actor = this.actor;
    const actorData = actor.system;

    // Lazy roll data
    const lazy = {
      get rollData() {
        this._cache ??= actor.getRollData();
        return this._cache;
      },
    };

    const getNotes = async (context) =>
      (await actor.getContextNotesParsed(context, { rollData: lazy.rollData, roll: false })).map((n) => n.text);

    let header, subHeader;
    const details = [];
    const paths = [];
    const sources = [];
    let notes;

    const re = /^(?<id>[\w-]+)(?:\.(?<detail>.*))?$/.exec(fullId);
    const { id, detail } = re?.groups ?? {};

    switch (id) {
      case "loyalty":
      case "secrecy":
      case "security":
        paths.push({
          path: `@${id}.total`,
          value: actorData[id].total,
        });
        sources.push({
          sources: actor.getSourceDetails(`system.${id}.total`),
          untyped: true,
        });
        notes = await getNotes(`${pf1rs.config.changePrefix}_${id}`);
        break;
      case "action":
        paths.push({
          path: `@actions.${detail}.bonus`,
          value: actorData.actions[detail].bonus,
        });
        sources.push({
          sources: actor.getSourceDetails(`system.actions.${detail}.bonus`),
          untyped: true,
        });
        break;
      case "danger":
        paths.push({
          path: "@danger.total",
          value: actorData.danger.total,
        });
        sources.push({
          sources: actor.getSourceDetails(`system.danger.total`),
          untyped: true,
        });
        break;
      case "notoriety":
        paths.push({
          path: "@notoriety",
          value: actorData.notoriety,
        });
        notes = await getNotes(`${pf1rs.config.changePrefix}_notoriety`);
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
