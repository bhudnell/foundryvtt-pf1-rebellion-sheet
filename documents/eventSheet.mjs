import { CFG, allChangeTargets } from "../config.mjs";
import { getChangeCategories } from "../utils.mjs";

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

    const data = {
      ...item,
      enrichedDesc: await TextEditor.enrichHTML(item.system.description),
    };

    data.changes = item.system.changes.map((c) => ({
      ...c,
      abilityLabel: game.i18n.localize(allChangeTargets[c.ability]),
    }));

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".add-change").click((e) => this._onAddChange(e));
    html.find(".delete-change").click((e) => this._onDeleteChange(e));
    html.find(".change-target").click((e) => this._onChangeTargetControl(e));
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

  _onChangeTargetControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    const li = a.closest(".change-target");
    const changeId = li.dataset.change;
    const change = this.item.system.changes.find((c) => c.id === changeId);

    const item = change.ability;
    const categories = getChangeCategories();
    const category = categories.find((c) => c.items.some((i) => i.key === item))?.key;

    // Show widget
    const w = new pf1.applications.Widget_CategorizedItemPicker(
      { title: "PF1.Application.ChangeTargetSelector.Title", classes: ["change-target-selector"] },
      categories,
      (key) => {
        if (key) {
          const changes = foundry.utils.deepClone(this.item.system.changes ?? []);
          const idx = changes.findIndex((change) => change.id === changeId);
          if (idx >= 0) {
            changes[idx] = foundry.utils.mergeObject(changes[idx], { ability: key });
            return this.item.update({ "system.changes": changes });
          }
        }
      },
      { category, item }
    );
    w.render(true);
  }
}
