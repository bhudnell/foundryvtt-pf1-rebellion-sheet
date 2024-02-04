import { CFG } from "../config.mjs";

export class TeamSheet extends ItemSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/team-sheet.hbs`,
      classes: [...options.classes, "rebellion", "team"],
    };
  }

  async getData() {
    const item = this.item;

    const context = {
      ...item,
      enrichedDesc: await TextEditor.enrichHTML(item.system.description),
    };

    return context;
  }
}
