import { CFG } from "../config.mjs";

export class EventSheet extends ItemSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/event-sheet.hbs`,
      classes: [...options.classes, "rebellion", "event"],
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

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".add-change").click(this._onAddChange.bind(this));
    html.find(".delete-change").click(this._onDeleteChange.bind(this));
  }

  async _onAddChange(event) {
    event.preventDefault();

    const changes = foundry.utils.deepClone(this.item.system.changes ?? []);
    changes.push({
      ability: null,
      bonus: null,
      id: foundry.utils.randomID(),
    });
    await this._onSubmit(event, {
      updateData: { "system.changes": changes },
    });
  }

  async _onDeleteChange(event) {
    event.preventDefault();
    const a = event.currentTarget;

    const li = a.closest(".delete-change");
    const changeId = li.dataset.change;

    const changes = foundry.utils.deepClone(this.item.system.changes ?? []);
    changes.findSplice((c) => c.id === changeId);

    return this._onSubmit(event, {
      updateData: { "system.changes": changes },
    });
  }
}
