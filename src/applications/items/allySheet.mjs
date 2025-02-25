import { ItemBaseSheet } from "./itemBaseSheet.mjs";

export class AllySheet extends ItemBaseSheet {
  async getData(options = {}) {
    const itemData = this.item.system;
    const context = await super.getData(options);

    // actions
    context.actions = itemData.rActions.map((action) => pf1rs.config.actions[action]);

    return context;
  }
}
