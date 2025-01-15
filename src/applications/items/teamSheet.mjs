import { actions, teamSubTypes, teamBaseTypes } from "../../config/config.mjs";

import { ItemBaseSheet } from "./itemBaseSheet.mjs";

export class TeamSheet extends ItemBaseSheet {
  async getData(options = {}) {
    const item = this.item;
    const itemData = item.system;
    const context = await super.getData(options);

    // sub-types
    context.subTypeOptions = pf1rs.config.teamSubTypes;
    context.isUnique = itemData.subType === "unique";

    // team types
    context.baseTypeOptions = { "": "", ...pf1rs.config.teamBaseTypes };

    // manager choices, only officers from parent sheet can be managers
    const managerOptions = { "": "" };
    if (item.parent) {
      Object.values(item.parent.system.officers).forEach((officer) => {
        console.error(officer); // todo probably need a flatmap here
        if (officer.actorId) {
          managerOptions[officer.actorId] = officer.name;
        }
      });
    }
    context.validManagerOptions = managerOptions;

    // actions
    context.actions = itemData.rActions.value.map((action) => game.i18n.localize(actions[action])).join(", ");

    // sidebar info
    context.states = [
      {
        field: "system.disabled",
        value: itemData.disabled,
        label: game.i18n.localize("PF1RS.Disabled"),
      },
      {
        field: "system.missing",
        value: itemData.missing,
        label: game.i18n.localize("PF1RS.Missing"),
      },
    ];

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".edit-actions").on("click", () => this._onActionsEdit());
  }

  _onActionsEdit() {
    const choices = Object.fromEntries(Object.entries(actions).map(([key, label]) => [key, game.i18n.localize(label)]));

    const app = new pf1.applications.ActorTraitSelector(this.item, {
      name: "system.rActions",
      title: "Test2", // TODO rename
      subject: "actions",
      choices,
    });
    app.render(true, { focus: true });
  }
}
