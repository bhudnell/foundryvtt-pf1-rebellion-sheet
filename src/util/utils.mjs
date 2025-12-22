export function getRankFromSupporters(supporters) {
  if (supporters > 5349) {
    return 20;
  }
  if (supporters > 3849) {
    return 19;
  }
  if (supporters > 2699) {
    return 18;
  }
  if (supporters > 1899) {
    return 17;
  }
  if (supporters > 1349) {
    return 16;
  }
  if (supporters > 954) {
    return 15;
  }
  if (supporters > 664) {
    return 14;
  }
  if (supporters > 474) {
    return 13;
  }
  if (supporters > 329) {
    return 12;
  }
  if (supporters > 234) {
    return 11;
  }
  if (supporters > 159) {
    return 10;
  }
  if (supporters > 104) {
    return 9;
  }
  if (supporters > 74) {
    return 8;
  }
  if (supporters > 54) {
    return 7;
  }
  if (supporters > 39) {
    return 6;
  }
  if (supporters > 29) {
    return 5;
  }
  if (supporters > 19) {
    return 4;
  }
  if (supporters > 14) {
    return 3;
  }
  if (supporters > 9) {
    return 2;
  }
  return 1;
}

export async function rollEventTable(event, message) {
  event.preventDefault();

  const actor = ChatMessage.getSpeakerActor(message.speaker);

  const danger = actor.system.danger.total;
  const table = await fromUuid(`Compendium.${pf1rs.config.moduleId}.roll-tables.RollTable.lwDFVwZyV70DxBOj`);
  const roll = new pf1.dice.RollPF(`1d100 + ${danger}[${game.i18n.localize("PF1RS.Danger")}]`); // TODO make this looks like roll-ext.hbs from pf1 system

  const { roll: rollReal, results } = await table.draw({ roll, displayChat: false });

  const tempResults = results.map((r) => {
    const data = foundry.utils.duplicate(r.toObject());
    delete data._id;
    return new foundry.documents.TableResult(data, { parent: r.parent });
  });

  for (const result of tempResults) {
    const eventId = Object.entries(pf1rs.config.eventCompendiumEntries).find(
      ([_, value]) => value === result.documentUuid
    )?.[0];
    // eslint-disable-next-line no-await-in-loop
    const immunity = await actor.getEventImmunitiesParsed(`${pf1rs.config.changePrefix}_${eventId}`);

    if (immunity.length) {
      result.name += ` - ${game.i18n.localize("PF1RS.Immune")}`;
      result.description = immunity.map((i) => i.text).join("<br>");
    }
  }

  await table.toMessage(tempResults, { roll: rollReal });
}

/**
 * Recursively transforms an ES module to a regular, writable object.
 *
 * @internal
 * @template T
 * @param {T} module - The ES module to transform.
 * @returns {T} The transformed module.
 */
export function moduleToObject(module) {
  const result = {};
  for (const key in module) {
    if (Object.prototype.toString.call(module[key]) === "[object Module]") {
      result[key] = moduleToObject(module[key]);
    } else {
      result[key] = module[key];
    }
  }
  return result;
}

export function keepUpdateArray(sourceObj, targetObj, keepPath) {
  const newValue = foundry.utils.getProperty(targetObj, keepPath);
  if (newValue == null) {
    return;
  }
  if (Array.isArray(newValue)) {
    return;
  }

  const newArray = foundry.utils.deepClone(foundry.utils.getProperty(sourceObj, keepPath) || []);

  for (const [key, value] of Object.entries(newValue)) {
    if (foundry.utils.getType(value) === "Object") {
      const subData = foundry.utils.expandObject(value);
      newArray[key] = foundry.utils.mergeObject(newArray[key], subData);
    } else {
      newArray[key] = value;
    }
  }

  foundry.utils.setProperty(targetObj, keepPath, newArray);
}

export class DefaultChange extends pf1.components.ItemChange {
  constructor(formula, target, flavor, options = {}) {
    const data = {
      formula,
      target,
      type: "untyped",
      operator: "add",
      priority: 1000,
      flavor: game.i18n.localize(flavor),
    };

    super(data, options);
  }
}

export function applyChange(change, actor, targets = null, { applySourceInfo = true, rollData } = {}) {
  // Prepare change targets
  targets ??= change.getTargets(actor);

  rollData ??= change.parent ? change.parent.getRollData({ refresh: true }) : actor.getRollData({ refresh: true });

  const overrides = actor.changeOverrides;
  for (const t of targets) {
    const override = overrides[t];
    const operator = change.operator;

    // HACK: Data prep change application creates overrides; only changes meant for manual comparison lack them,
    // and those do not have to be applied to the actor.
    // This hack enables calling applyChange on Changes that are not meant to be applied, but require a call to
    // determine effective operator and/or value.
    if (!override) {
      continue;
    }

    let value = 0;
    if (change.formula) {
      if (!isNaN(change.formula)) {
        value = parseFloat(change.formula);
      } else if (change.isDeferred && pf1.dice.RollPF.parse(change.formula).some((t) => !t.isDeterministic)) {
        value = pf1.dice.RollPF.replaceFormulaData(change.formula, rollData, { missing: 0 });
      } else {
        value = pf1.dice.RollPF.safeRollSync(
          change.formula,
          rollData,
          { formula: change.formula, target: t, change, rollData },
          { suppressError: change.parent && !change.parent.isOwner },
          { maximize: true }
        ).total;
      }
    }

    // if the item is mitigated, halve the value
    // These three lines are the only differences between this function and the system ItemChange.applyChange function
    if (change.parent?.system.mitigated) {
      value = Math.floor(value / 2);
    }

    change.value = value;

    if (!t) {
      continue;
    }

    const prior = override[operator][change.type];

    switch (operator) {
      case "add":
        {
          let base = foundry.utils.getProperty(actor, t);

          // Don't change non-existing ability scores
          if (base == null) {
            if (t.match(/^system\.abilities/)) {
              continue;
            }
            base = 0;
          }

          // Deferred formula
          if (typeof value === "string") {
            break;
          }

          if (typeof base === "number") {
            // Skip positive dodge modifiers if lose dex to AC is in effect
            if (actor.changeFlags.loseDexToAC && value > 0 && change.type === "dodge" && change.isAC) {
              continue;
            }

            if (pf1.config.stackingBonusTypes.includes(change.type)) {
              // Add stacking bonus
              foundry.utils.setProperty(actor, t, base + value);
              override[operator][change.type] = (prior ?? 0) + value;
            } else {
              // Use higher value only
              const diff = !prior ? value : Math.max(0, value - (prior ?? 0));
              foundry.utils.setProperty(actor, t, base + diff);
              override[operator][change.type] = Math.max(prior ?? 0, value);
            }
          }
        }
        break;

      case "set":
        foundry.utils.setProperty(actor, t, value);
        override[operator][change.type] = value;
        break;
    }

    if (applySourceInfo) {
      change.applySourceInfo(actor);
    }

    // Adjust ability modifier
    const modifierChanger = t.match(/^system\.abilities\.([a-zA-Z0-9]+)\.(?:total|penalty|base)$/);
    const abilityTarget = modifierChanger?.[1];
    if (abilityTarget) {
      const ability = actor.system.abilities[abilityTarget];
      ability.mod = pf1.utils.getAbilityModifier(ability.total, {
        damage: ability.damage,
        penalty: ability.penalty,
      });
    }
  }
}
