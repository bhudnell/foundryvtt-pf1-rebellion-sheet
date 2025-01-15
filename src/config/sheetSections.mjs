import { allyId, eventId, teamId } from "./config.mjs";

export const sheetSections = {
  rebellionAlly: {
    building: {
      create: { type: allyId },
      filters: [{ type: allyId }],
      interface: {},
      label: `PF1.Subtypes.Item.${allyId}.Plural`,
      browseLabel: "PF1RS.Browse.Allies",
    },
  },
  rebellionEvent: {
    active: {
      create: { type: eventId, system: { subType: "active" } },
      filters: [{ type: eventId, subTypes: ["active"] }],
      interface: {},
      label: `PF1.Subtypes.Item.${eventId}.active.Plural`,
      browseLabel: "PF1RS.Browse.Events",
    },
    misc: {
      create: { type: eventId, system: { subType: "misc" } },
      filters: [{ type: eventId, subTypes: ["misc"] }],
      interface: {},
      label: `PF1.Subtypes.Item.${eventId}.misc.Plural`,
      browseLabel: "PF1RS.Browse.Events",
    },
  },
  rebellionTeam: {
    general: {
      create: { type: teamId, system: { subType: "general" } },
      filters: [{ type: teamId, subTypes: ["general"] }],
      interface: {},
      label: `PF1.Subtypes.Item.${teamId}.general.Plural`,
      browseLabel: "PF1RS.Browse.Teams",
    },
    special: {
      create: { type: teamId, system: { subType: "unique" } },
      filters: [{ type: teamId, subTypes: ["unique"] }],
      interface: {},
      label: `PF1.Subtypes.Item.${teamId}.unique.Plural`,
      browseLabel: "PF1RS.Browse.Teams",
    },
  },
};
