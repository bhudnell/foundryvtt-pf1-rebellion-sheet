import { RebellionSheet } from "./applications/actors/rebellionSheet.mjs";
import { AllySheet } from "./applications/items/allySheet.mjs";
import { EventSheet } from "./applications/items/eventSheet.mjs";
import { TeamSheet } from "./applications/items/teamSheet.mjs";
import * as Config from "./config/_module.mjs";
import { AllyBrowser } from "./config/compendiumBrowser/allyBrowser.mjs";
import { EventBrowser } from "./config/compendiumBrowser/eventBrowser.mjs";
import { TeamBrowser } from "./config/compendiumBrowser/teamBrowser.mjs";
import * as PF1RS from "./config/config.mjs";
import { RebellionModel } from "./dataModels/actors/rebellionModel.mjs";
import { AllyModel } from "./dataModels/items/allyModel.mjs";
import { EventModel } from "./dataModels/items/eventModel.mjs";
import { TeamModel } from "./dataModels/items/teamModel.mjs";
import { RebellionActor } from "./documents/actors/rebellionActor.mjs";
import { BaseItem } from "./documents/items/baseItem.mjs";
import { getChangeFlat } from "./hooks/getChangeFlat.mjs";
import { applyChange, moduleToObject, rollEventTable } from "./util/utils.mjs";

export { PF1RS as config };
globalThis.pf1rs = moduleToObject({
  config: PF1RS,
});

Hooks.on("preCreateItem", (item, data, context, user) => {
  if (!item.actor) {
    return;
  }

  if (item.actor.type !== PF1RS.sheetId && [PF1RS.allyId, PF1RS.eventId, PF1RS.teamId].includes(item.type)) {
    ui.notifications.error("PF1RS.NoRebellionItemsOnActor", { localize: true });
    return false;
  }

  if (item.actor.type === PF1RS.sheetId && ![PF1RS.allyId, PF1RS.eventId, PF1RS.teamId].includes(item.type)) {
    ui.notifications.error("PF1RS.OnlyRebellionItemsOnActor", { localize: true });
    return false;
  }
});

Hooks.once("libWrapper.Ready", () => {
  console.log(`${PF1RS.moduleId} | Registering LibWrapper Hooks`);

  // changes token HUD conditions for module actors
  libWrapper.register(
    PF1RS.moduleId,
    "TokenHUD.prototype._getStatusEffectChoices",
    function (wrapper) {
      if (this.object.actor.type === PF1RS.sheetId) {
        return {};
      }
      return wrapper();
    },
    libWrapper.MIXED
  );

  // adds subtypes for improvement and event item creation
  libWrapper.register(
    PF1RS.moduleId,
    "pf1.applications.item.CreateDialog.prototype.getSubtypes",
    function (wrapper, type) {
      switch (type) {
        case PF1RS.allyId:
          return null;

        case PF1RS.eventId:
          return PF1RS.eventSubTypes;

        case PF1RS.teamId:
          return PF1RS.teamSubTypes;

        default:
          return wrapper(type);
      }
    },
    libWrapper.MIXED
  );

  // lets changes be halved if item has mitigated flag for module
  libWrapper.register(
    PF1RS.moduleId,
    "pf1.components.ItemChange.prototype.applyChange",
    function (wrapper, actor, targets, options) {
      if (actor.type.startsWith(PF1RS.moduleId)) {
        applyChange(this, actor, targets, options);
      } else {
        return wrapper(actor, targets, options);
      }
    },
    libWrapper.MIXED
  );
});

Hooks.on("pf1GetChangeFlat", getChangeFlat);

Hooks.on("renderChatMessage", (message, html) => {
  if (message.flags?.[PF1RS.moduleId]?.eventChanceCard) {
    html.find("button.roll-event").on("click", (e) => rollEventTable(e, message));
  }
});

Hooks.once("init", () => {
  CONFIG.Actor.documentClasses[PF1RS.sheetId] = RebellionActor;
  CONFIG.Item.documentClasses[PF1RS.allyId] = BaseItem;
  CONFIG.Item.documentClasses[PF1RS.eventId] = BaseItem;
  CONFIG.Item.documentClasses[PF1RS.teamId] = BaseItem;

  pf1.documents.actor.RebellionActor = RebellionActor;
  pf1.documents.item.AllyItem = BaseItem;
  pf1.documents.item.EventItem = BaseItem;
  pf1.documents.item.TeamItem = BaseItem;

  CONFIG.Actor.dataModels[PF1RS.sheetId] = RebellionModel;
  CONFIG.Item.dataModels[PF1RS.allyId] = AllyModel;
  CONFIG.Item.dataModels[PF1RS.eventId] = EventModel;
  CONFIG.Item.dataModels[PF1RS.teamId] = TeamModel;

  pf1.applications.actor.RebellionSheet = RebellionSheet;
  pf1.applications.item.AllySheet = AllySheet;
  pf1.applications.item.EventSheet = EventSheet;
  pf1.applications.item.TeamSheet = TeamSheet;

  Actors.registerSheet(PF1RS.moduleId, RebellionSheet, {
    label: game.i18n.localize("PF1RS.Sheet.Rebellion"),
    types: [PF1RS.sheetId],
    makeDefault: true,
  });
  Items.registerSheet(PF1RS.moduleId, AllySheet, {
    label: game.i18n.localize("PF1RS.Sheet.Ally"),
    types: [PF1RS.allyId],
    makeDefault: true,
  });
  Items.registerSheet(PF1RS.moduleId, EventSheet, {
    label: game.i18n.localize("PF1RS.Sheet.Event"),
    types: [PF1RS.eventId],
    makeDefault: true,
  });
  Items.registerSheet(PF1RS.moduleId, TeamSheet, {
    label: game.i18n.localize("PF1RS.Sheet.Team"),
    types: [PF1RS.teamId],
    makeDefault: true,
  });

  // remove module buff targets from non module items
  for (const prop of ["buffTargetCategories", "contextNoteCategories"]) {
    for (const categoryKey in pf1.config[prop]) {
      const category = pf1.config[prop][categoryKey];
      category.filters ??= {};
      category.filters.item ??= {};
      category.filters.item.exclude ??= [];
      category.filters.item.exclude.push(...PF1RS.itemTypes);
      pf1.config[prop][categoryKey] = category;
    }
  }

  foundry.utils.mergeObject(pf1.config, Object.assign({}, Config));
});

Hooks.once("setup", () => {
  // re-prepare rebellions once all their dependencies are prepared
  game.actors.filter((a) => a.type === pf1rs.config.sheetId).forEach((a) => a.prepareData());
});

Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM) {
    ui.notifications.error("PF1RS.LibWrapperError");
  }

  loadTemplates({
    "rebellion-sheet-actions": `modules/${PF1RS.moduleId}/templates/actors/rebellion/parts/actions.hbs`,
    "rebellion-sheet-allies": `modules/${PF1RS.moduleId}/templates/actors/rebellion/parts/allies.hbs`,
    "rebellion-sheet-events": `modules/${PF1RS.moduleId}/templates/actors/rebellion/parts/events.hbs`,
    "rebellion-sheet-officers": `modules/${PF1RS.moduleId}/templates/actors/rebellion/parts/officers.hbs`,
    "rebellion-sheet-summary": `modules/${PF1RS.moduleId}/templates/actors/rebellion/parts/summary.hbs`,
    "rebellion-sheet-teams": `modules/${PF1RS.moduleId}/templates/actors/rebellion/parts/teams.hbs`,

    "item-sheet-ally": `modules/${PF1RS.moduleId}/templates/items/parts/ally-details.hbs`,
    "item-sheet-event": `modules/${PF1RS.moduleId}/templates/items/parts/event-details.hbs`,
    "item-sheet-team": `modules/${PF1RS.moduleId}/templates/items/parts/team-details.hbs`,

    "item-sheet-changes": `modules/${PF1RS.moduleId}/templates/items/parts/changes.hbs`,
  });

  pf1.applications.compendiums.ally = new AllyBrowser();
  pf1.applications.compendiums.event = new EventBrowser();
  pf1.applications.compendiums.team = new TeamBrowser();

  pf1.applications.compendiumBrowser.ally = AllyBrowser;
  pf1.applications.compendiumBrowser.event = EventBrowser;
  pf1.applications.compendiumBrowser.team = TeamBrowser;

  game.model.Item[PF1RS.allyId] = {};
  game.model.Item[PF1RS.eventId] = {};
  game.model.Item[PF1RS.teamId] = {};
});

Hooks.once("i18nInit", () => {
  const toLocalize = [
    "actions",
    "officerRoles",
    "officerBonuses",
    "orgChecks",
    "orgOfficers",
    "eventSubTypes",
    "teamBaseTypes",
    "teamSubTypes",
  ];

  const doLocalize = (obj, cat) => {
    // Create tuples of (key, localized object/string)
    const localized = Object.entries(obj).reduce((arr, [key, value]) => {
      if (typeof value === "string") {
        arr.push([key, game.i18n.localize(value)]);
      } else if (typeof value === "object") {
        arr.push([key, doLocalize(value, `${cat}.${key}`)]);
      }
      return arr;
    }, []);

    // Get the localized and sorted object out of tuple
    return localized.reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  };

  for (let o of toLocalize) {
    pf1rs.config[o] = doLocalize(pf1rs.config[o], o);
  }

  // localize rebellionActions in pf1 config
  pf1.config.rebellionActions = doLocalize(pf1.config.rebellionActions, "rebellionActions");
});
