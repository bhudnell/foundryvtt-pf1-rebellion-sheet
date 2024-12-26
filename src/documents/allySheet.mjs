import { CFG, actions, allChangeTargets } from "../config.mjs";
import { getChangeCategories } from "../utils.mjs";

export class AllySheet extends ItemSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/items/item-sheet.hbs`,
      classes: [...options.classes, "rebellion", "item", "ally"],
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
      isAlly: true,
      type: game.i18n.localize("PF1RS.Ally"),
      enrichedDesc: await TextEditor.enrichHTML(item.system.description),
    };

    data.changes = item.system.changes.map((c) => ({
      ...c,
      abilityLabel: game.i18n.localize(allChangeTargets[c.ability]),
    }));

    // actions
    data.actions = item.system.actions.value.map((action) => game.i18n.localize(actions[action])).join(", ");

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".add-change").on("click", (e) => this._onAddChange(e));
    html.find(".delete-change").on("click", (e) => this._onDeleteChange(e));
    html.find(".target-change").on("click", (e) => this._onTargetChange(e));

    html.find(".edit-actions").on("click", () => this._onActionsEdit());
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

    const changeId = event.currentTarget.closest(".item").dataset.id;

    const changes = foundry.utils.deepClone(this.item.system.changes ?? []);
    changes.findSplice((c) => c.id === changeId);

    return this._onSubmit(event, {
      updateData: { "system.changes": changes },
    });
  }

  _onTargetChange(event) {
    event.preventDefault();

    const changeId = event.currentTarget.closest(".item").dataset.id;
    const change = this.item.system.changes.find((c) => c.id === changeId);

    const item = change.ability;
    const categories = getChangeCategories();
    const category = categories.find((c) => c.items.some((i) => i.key === item))?.key;

    // Show widget
    const app = new pf1.applications.Widget_CategorizedItemPicker(
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
    app.render(true);
  }

  _onActionsEdit() {
    const choices = Object.fromEntries(Object.entries(actions).map(([key, label]) => [key, game.i18n.localize(label)]));

    const app = new pf1.applications.ActorTraitSelector(this.item, {
      name: "system.actions",
      title: "Test2", // TODO rename
      subject: "actions",
      choices,
    });
    app.render(true, { focus: true });
  }
}
