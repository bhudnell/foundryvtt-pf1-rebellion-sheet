import { CFG, allChangeTargets } from "../config.mjs";
import { getChangeCategories } from "../utils.mjs";

export class EventSheet extends ItemSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/item-sheet.hbs`,
      classes: [...options.classes, "rebellion", "item", "event"],
      tabs: [
        {
          navSelector: "nav.tabs[data-group='primary']",
          contentSelector: "section.primary-body",
          initial: "description",
          group: "primary",
        },
      ],
    };
  }

  async getData() {
    const item = this.item;

    const data = {
      ...item,
      isEvent: true,
      type: game.i18n.localize("PF1RS.Event"),
      enrichedDesc: await TextEditor.enrichHTML(item.system.description),
    };

    data.states = [
      {
        field: "system.persistent",
        value: item.system.persistent,
        label: game.i18n.localize("PF1RS.Persistent"),
      },
      {
        field: "system.mitigated",
        value: item.system.mitigated,
        label: game.i18n.localize("PF1RS.Mitigated"),
      },
    ];

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
