import { rebellionSheetId, CFG, rebellionEventId, rebellionTeamId, rebellionAllyId } from "./config.mjs";
import { AllySheet } from "./documents/allySheet.mjs";
import { EventSheet } from "./documents/eventSheet.mjs";
import { RebellionSheet } from "./documents/rebellionSheet.mjs";
import { TeamSheet } from "./documents/teamSheet.mjs";
import { AllyModel } from "./models/allyModel.mjs";
import { EventModel } from "./models/eventModel.mjs";
import { RebellionModel } from "./models/rebellionModel.mjs";
import { TeamModel } from "./models/teamModel.mjs";
import { rollEventTable } from "./utils.mjs";

Hooks.on("preCreateItem", (item, data, context, user) => {
  if (!item.actor) {
    return;
  }

  if ([rebellionEventId, rebellionTeamId, rebellionAllyId].includes(item.type)) {
    if (item.actor.type !== rebellionSheetId) {
      ui.notifications.error(`"${item.actor.type}" actor can't have Rebellion items`);
      return false;
    }
  }

  if (![rebellionEventId, rebellionTeamId, rebellionAllyId].includes(item.type)) {
    if (item.actor.type === rebellionSheetId) {
      ui.notifications.error(`"${item.actor.type}" actor can only have Rebellion items`);
      return false;
    }
  }
});

Hooks.once("init", () => {
  CONFIG.Actor.dataModels[rebellionSheetId] = RebellionModel;
  CONFIG.Item.dataModels[rebellionEventId] = EventModel;
  CONFIG.Item.dataModels[rebellionTeamId] = TeamModel;
  CONFIG.Item.dataModels[rebellionAllyId] = AllyModel;

  Actors.registerSheet(CFG.id, RebellionSheet, {
    label: game.i18n.localize("PF1RS.Sheet.Rebellion"),
    types: [rebellionSheetId],
    makeDefault: true,
  });
  Items.registerSheet(CFG.id, EventSheet, {
    label: game.i18n.localize("PF1RS.Sheet.Event"),
    types: [rebellionEventId],
    makeDefault: true,
  });
  Items.registerSheet(CFG.id, TeamSheet, {
    label: game.i18n.localize("PF1RS.Sheet.Team"),
    types: [rebellionTeamId],
    makeDefault: true,
  });
  Items.registerSheet(CFG.id, AllySheet, {
    label: game.i18n.localize("PF1RS.Sheet.Ally"),
    types: [rebellionAllyId],
    makeDefault: true,
  });
});

Hooks.on("renderChatMessage", (message, html) => {
  if (message.flags?.[CFG.id]?.eventChanceCard) {
    html.find("button.roll-event").on("click", (e) => rollEventTable(e, message));
  }
});
