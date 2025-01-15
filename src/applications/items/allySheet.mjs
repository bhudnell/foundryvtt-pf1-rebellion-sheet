import { actions } from "../../config/config.mjs";

import { ItemBaseSheet } from "./itemBaseSheet.mjs";

export class AllySheet extends ItemBaseSheet {
  async getData(options = {}) {
    const itemData = this.item.system;
    const context = await super.getData(options);

    // actions
    context.actions = itemData.rActions.value.map((action) => game.i18n.localize(actions[action])).join(", ");

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
