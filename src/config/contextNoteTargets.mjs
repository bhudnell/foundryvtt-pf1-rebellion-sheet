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
};

export const contextNoteCategories = {
  [`${changePrefix}_org_checks`]: {
    label: "PF1RS.OrgCheck",
    filters: { item: { include: itemTypes } },
  },
};
