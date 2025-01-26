export function getChangeFlat(result, target, modifierType, value, actor) {
  const [prefix, realTarget] = target.split("_");
  if (prefix !== pf1rs.config.changePrefix) {
    return result;
  }

  // org checks
  if (realTarget in pf1rs.config.orgChecks) {
    result.push(`system.${realTarget}.total`);
  } else if (realTarget === "allOrgChecks") {
    result.push("system.loyalty.total", "system.secrecy.total", "system.security.total");
  }

  // actions
  else if (realTarget in pf1rs.config.actions) {
    result.push(`system.actions.${realTarget}.bonus`);
  }

  // danger
  else if (realTarget === "danger") {
    result.push("system.danger.total");
  }

  return result;
}
