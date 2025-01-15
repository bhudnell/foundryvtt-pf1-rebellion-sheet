export class ItemBaseSheet extends pf1.applications.item.ItemSheetPF {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      classes: [...options.classes, "rebellion"],
    };
  }

  get template() {
    return `modules/${pf1rs.config.moduleId}/templates/items/item-sheet.hbs`;
  }

  async getData(options = {}) {
    const context = await super.getData(options);

    const item = this.item;
    context.isAlly = item.type === pf1rs.config.allyId;
    context.isEvent = item.type === pf1rs.config.eventId;
    context.isTeam = item.type === pf1rs.config.teamId;

    return context;
  }

  async _updateObject(event, formData) {
    return ItemSheet.prototype._updateObject.call(this, event, formData);
  }
}
