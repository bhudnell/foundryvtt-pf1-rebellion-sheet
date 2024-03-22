import { CFG, changeTargets } from "../config.mjs";

export class AllySheet extends ItemSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/ally-sheet.hbs`,
      classes: [...options.classes, "rebellion", "ally"],
    };
  }

  async getData() {
    const item = this.item;

    const data = {
      ...item,
      enrichedDesc: await TextEditor.enrichHTML(item.system.description),
    };

    data.changeTargetOptions = Object.fromEntries(
      Object.entries(changeTargets).map(([key, label]) => [key, game.i18n.localize(label)])
    );

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".add-change").click((e) => this._onAddChange(e));
    html.find(".delete-change").click((e) => this._onDeleteChange(e));
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
