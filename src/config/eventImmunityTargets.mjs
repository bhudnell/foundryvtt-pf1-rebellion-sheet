import { changePrefix, events, itemTypes } from "./config.mjs";

export const eventImmunityTargets = {
  ...Object.entries(events).reduce((acc, [key, label]) => {
    acc[`${changePrefix}_${key}`] = { category: `${changePrefix}_events`, label };
    return acc;
  }, {}),
};

export const eventImmunityCategories = {
  [`${changePrefix}_events`]: {
    label: "PF1RS.EventsLabel",
    filters: { item: { include: itemTypes } },
  },
};
