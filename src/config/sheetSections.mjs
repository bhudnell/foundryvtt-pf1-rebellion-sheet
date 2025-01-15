import { armyId, boonId, buildingId, eventId, improvementId, specialId, tacticId } from "./config.mjs";
// TODO
export const sheetSections = {
  armyFeature: {
    tactic: {
      create: { type: tacticId },
      filters: [{ type: tacticId }],
      interface: {
        disable: true,
      },
      label: `PF1.Subtypes.Item.${tacticId}.Plural`,
      browseLabel: "PF1KS.Browse.Tactics",
    },
    special: {
      create: { type: specialId },
      filters: [{ type: specialId }],
      interface: {},
      label: `PF1.Subtypes.Item.${specialId}.Plural`,
      browseLabel: "PF1KS.Browse.Special",
    },
  },
  armyCommander: {
    boon: {
      create: { type: boonId },
      filters: [{ type: boonId }],
      interface: {},
      label: `PF1.Subtypes.Item.${boonId}.Plural`,
      browseLabel: "PF1KS.Browse.Boons",
    },
  },
  kingdomSettlement: {
    building: {
      create: { type: buildingId },
      filters: [{ type: buildingId }],
      interface: {},
      label: `PF1.Subtypes.Item.${buildingId}.Plural`,
      browseLabel: "PF1KS.Browse.Buildings",
    },
  },
  kingdomTerrain: {
    general: {
      create: { type: improvementId, system: { subType: "general" } },
      filters: [{ type: improvementId, subTypes: ["general"] }],
      interface: {},
      label: `PF1.Subtypes.Item.${improvementId}.general.Plural`,
      browseLabel: "PF1KS.Browse.Improvements",
    },
    special: {
      create: { type: improvementId, system: { subType: "special" } },
      filters: [{ type: improvementId, subTypes: ["special"] }],
      interface: {},
      label: `PF1.Subtypes.Item.${improvementId}.special.Plural`,
      browseLabel: "PF1KS.Browse.Improvements",
    },
  },
  kingdomEvent: {
    active: {
      create: { type: eventId, system: { subType: "active" } },
      filters: [{ type: eventId, subTypes: ["active"] }],
      interface: {},
      label: `PF1.Subtypes.Item.${eventId}.active.Plural`,
      browseLabel: "PF1KS.Browse.Events",
    },
    misc: {
      create: { type: eventId, system: { subType: "misc" } },
      filters: [{ type: eventId, subTypes: ["misc"] }],
      interface: {},
      label: `PF1.Subtypes.Item.${eventId}.misc.Plural`,
      browseLabel: "PF1KS.Browse.Events",
    },
  },
  kingdomArmy: {
    army: {
      create: { type: armyId },
      filters: [{ type: armyId }],
      interface: {},
      label: `PF1.Subtypes.Item.${armyId}.Plural`,
    },
  },
};
