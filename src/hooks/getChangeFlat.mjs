export function getChangeFlat(result, target, modifierType, value, actor) {
  if (!target.startsWith(pf1rs.config.changePrefix)) {
    return result;
  }

  switch (target) {
    // todo
    case `${pf1rs.config.changePrefix}_consumption`:
      result.push("system.consumption.total");
      break;
  }

  return result;
}
