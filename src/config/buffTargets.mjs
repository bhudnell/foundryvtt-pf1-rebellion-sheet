import { actions, changePrefix, itemTypes, orgChecks } from "./config.mjs";

export const buffTargets = {
  ...Object.entries(orgChecks).reduce((acc, [key, label]) => {
    acc[`${changePrefix}_${key}`] = { category: `${changePrefix}_org_checks`, label };
    return acc;
  }, {}),
  [`${changePrefix}_allOrgChecks`]: {
    category: `${changePrefix}_org_checks`,
    label: "PF1RS.AllOrgChecks",
  },
  ...Object.entries(actions).reduce((acc, [key, label]) => {
    acc[`${changePrefix}_${key}`] = { category: `${changePrefix}_actions`, label };
    return acc;
  }, {}),
  [`${changePrefix}_danger`]: {
    category: `${changePrefix}_misc`,
    label: "PF1RS.Danger",
  },
};

export const buffTargetCategories = {
  [`${changePrefix}_org_checks`]: {
    label: "PF1RS.OrgCheck",
    filters: { item: { include: itemTypes } },
  },
  [`${changePrefix}_actions`]: {
    label: "PF1RS.ActionsLabel",
    filters: { item: { include: itemTypes } },
  },
  [`${changePrefix}_misc`]: {
    label: "PF1.Misc",
    filters: { item: { include: itemTypes } },
  },
};
