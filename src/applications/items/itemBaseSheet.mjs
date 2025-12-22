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

    if (item.system.eventImmunities) {
      context.eventImmunities = item.system.eventImmunities;
      for (const ei of context.eventImmunities) {
        pf1rs.config.events;
        const target = pf1.config.eventImmunityTargets[ei.target];
        ei.isValid = !!target;
        ei.label = target?.label ?? ei.target;
      }
    }

    return context;
  }

  async _updateObject(event, formData) {
    return ItemSheet.prototype._updateObject.call(this, event, formData);
  }

  activateListeners(jq) {
    super.activateListeners(jq);

    // Event immunity stuff
    jq.find(".event-immunity-control").on("click", (e) => this._onImmunityControl(e));
    jq.find(".event-immunity .event-immunity-target").on("click", (e) => this._onImmunityTargetControl(e));
  }

  async _onImmunityControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Add new immunity
    if (a.classList.contains("add-immunity")) {
      const eventImmunities = this.item.toObject().system.eventImmunities || [];
      eventImmunities.push({});
      const updateData = { "system.eventImmunities": eventImmunities };
      return this._updateObject(event, this._getSubmitData(updateData));
    }
    // Remove an immunity
    if (a.classList.contains("delete-immunity")) {
      const li = a.closest(".event-immunity");
      const eventImmunities = this.item.toObject().system.eventImmunities || [];
      eventImmunities.splice(Number(li.dataset.immunity), 1);
      const updateData = { "system.eventImmunities": eventImmunities };
      return this._updateObject(event, this._getSubmitData(updateData));
    }
  }

  _onImmunityTargetControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Prepare categories and changes to display
    const li = a.closest(".event-immunity");
    const eiIndex = Number(li.dataset.immunity);
    const immunity = this.item.system.eventImmunities[eiIndex];

    const categories = Object.values(
      Object.entries(pf1.config.eventImmunityTargets).reduce((cur, [key, { label, category, icon, ...options }]) => {
        if (!key.startsWith("~")) {
          cur[category] ??= {
            key: category,
            label: pf1.config.eventImmunityCategories[category].label,
            items: [],
            validity: pf1.utils.internal.isValidChangeTarget(pf1.config.eventImmunityCategories[category], {
              actor: this.item.actor,
              item: this.item,
            }),
          };

          cur[category].items.push({
            key,
            label,
            icon,
            validity: pf1.utils.internal.isValidChangeTarget(
              { key, label, category, icon, ...options },
              { actor: this.item.actor, item: this.item }
            ),
          });
        }
        return cur;
      }, {})
    );

    // Sort
    const lang = game.settings.get("core", "language");
    for (const category of categories) {
      category.items.sort((a, b) => a.label.localeCompare(b.label, lang));
    }

    const part1 = immunity?.target?.split(".")[0];
    const category = pf1.config.eventImmunityTargets[part1]?.category ?? part1;

    // Show widget
    const w = new pf1.applications.Widget_CategorizedItemPicker(
      { window: { title: "PF1RS.EventImmunityTargetSelector" } },
      categories,
      (key) => {
        if (key) {
          const updateData = {};
          updateData[`system.eventImmunities.${eiIndex}.target`] = key;
          this.item.update(updateData);
        }
      },
      { category, item: immunity?.target }
    );
    w.render(true);
  }
}
