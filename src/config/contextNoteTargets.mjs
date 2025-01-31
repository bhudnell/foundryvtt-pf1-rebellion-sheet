import { changePrefix, itemTypes, orgChecks } from "./config.mjs";

export const contextNoteTargets = {
  ...Object.entries(orgChecks).reduce((acc, [key, label]) => {
    acc[`${changePrefix}_${key}`] = { category: `${changePrefix}_org_checks`, label };
    return acc;
  }, {}),
  [`${changePrefix}_allOrgChecks`]: {
    category: `${changePrefix}_org_checks`,
    label: "PF1RS.AllOrgChecks",
  },
  [`${changePrefix}_notoriety`]: {
    category: `${changePrefix}_misc`,
    label: "PF1RS.Notoriety",
  },
};

export const contextNoteCategories = {
  [`${changePrefix}_org_checks`]: {
    label: "PF1RS.OrgCheck",
    filters: { item: { include: itemTypes } },
  },
  [`${changePrefix}_misc`]: {
    label: "PF1.Misc",
    filters: { item: { include: itemTypes } },
  },
};
