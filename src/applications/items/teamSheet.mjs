import { ItemBaseSheet } from "./itemBaseSheet.mjs";

export class TeamSheet extends ItemBaseSheet {
  async getData(options = {}) {
    const item = this.item;
    const itemData = item.system;
    const context = await super.getData(options);

    // sub-types
    context.subTypeOptions = pf1rs.config.teamSubTypes;
    context.isUnique = itemData.subType === "unique";
    context.uniqueLabel = game.i18n.localize(`PF1.Subtypes.Item.${pf1rs.config.teamId}.unique.Plural`);

    // team types
    context.baseTypeOptions = {
      "": "",
      ...Object.fromEntries(Object.entries(pf1rs.config.teamBaseTypes).map(([key, value]) => [key, value.name])),
    };
    context.isCustom = itemData.baseType === "custom";

    // manager choices, only officers from parent sheet can be managers
    const managerOptions = { "": "" };
    if (item.parent) {
      Object.values(item.parent.system.officers)
        .flatMap((o) => o)
        .forEach((officer) => {
          if (officer.actorId) {
            managerOptions[officer.actorId] = officer.name;
          }
        });
    }
    context.validManagerOptions = managerOptions;

    // actions
    context.actions = itemData.rActions.map((action) => pf1rs.config.actions[action]);

    // sidebar info
    context.subType = pf1rs.config.teamSubTypes[itemData.subType];
    context.states = [
      {
        field: "system.disabled",
        value: itemData.disabled,
        label: game.i18n.localize("PF1.Disabled"),
      },
      {
        field: "system.missing",
        value: itemData.missing,
        label: game.i18n.localize("PF1.Missing"),
      },
    ];

    return context;
  }
}
