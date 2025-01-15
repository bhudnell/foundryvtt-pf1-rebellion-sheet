import {
  actions,
  allSettlementModifiers,
  armyAttributes,
  armyItemTypes,
  changePrefix,
  kingdomItemTypes,
  kingdomStats,
  magicItemTypes,
} from "./config.mjs";
// TODO

export const orgCheckChangeTargets = {
  allOrgChecks: "PF1RS.AllOrgChecks",
  loyalty: "PF1RS.Loyalty",
  secrecy: "PF1RS.Secrecy",
  security: "PF1RS.Security",
};

export const miscChangeTargets = {
  danger: "PF1RS.Danger",
};

export const allChangeTargets = {
  ...orgCheckChangeTargets,
  ...actions,
  ...miscChangeTargets,
};

export const buffTargets = {
  ...Object.entries(kingdomStats).reduce((acc, [key, label]) => {
    acc[`${changePrefix}_${key}`] = { category: `${changePrefix}_kingdom_stats`, label };
    return acc;
  }, {}),
  ...Object.entries(allSettlementModifiers).reduce((acc, [key, label]) => {
    acc[`${changePrefix}_${key}`] = { category: `${changePrefix}_settlement_modifiers`, label };
    return acc;
  }, {}),
  ...Object.entries(magicItemTypes).reduce((acc, [key, label]) => {
    acc[`${changePrefix}_magic_item_${key}`] = { category: `${changePrefix}_magic_items`, label };
    return acc;
  }, {}),
  [`${changePrefix}_bonusBP`]: {
    category: `${changePrefix}_misc`,
    label: "PF1KS.BonusBP",
    filters: { item: { include: kingdomItemTypes } },
  },
  [`${changePrefix}_fame`]: {
    category: `${changePrefix}_misc`,
    label: "PF1KS.Fame",
    filters: { item: { include: kingdomItemTypes } },
  },
  [`${changePrefix}_infamy`]: {
    category: `${changePrefix}_misc`,
    label: "PF1KS.Infamy",
    filters: { item: { include: kingdomItemTypes } },
  },
  [`${changePrefix}_unrest_drop`]: {
    category: `${changePrefix}_misc`,
    label: "PF1KS.UnrestOnDrop",
    filters: { item: { include: kingdomItemTypes } },
  },
  [`${changePrefix}_unrest_continuous`]: {
    category: `${changePrefix}_misc`,
    label: "PF1KS.UnrestContinuous",
    filters: { item: { include: kingdomItemTypes } },
  },
};

export const buffTargetCategories = {
  [`${changePrefix}_kingdom_stats`]: {
    label: "PF1KS.KingdomStat",
    filters: { item: { include: kingdomItemTypes } },
  },
  [`${changePrefix}_settlement_modifiers`]: {
    label: "PF1KS.SettlementModifiers",
    filters: { item: { include: kingdomItemTypes } },
  },
  [`${changePrefix}_magic_items`]: {
    label: "PF1KS.MagicItems",
    filters: { item: { include: kingdomItemTypes } },
  },
  [`${changePrefix}_misc`]: {
    label: "PF1.Misc",
    filters: { item: { include: [...kingdomItemTypes, ...armyItemTypes] } },
  },
  [`${changePrefix}_army_attributes`]: {
    label: "PF1KS.ArmyAttributes",
    filters: { item: { include: armyItemTypes } },
  },
};
