import { CFG, actions, teamSubTypes, teamBaseTypes } from "../config.mjs";

export class TeamSheet extends ItemSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/item-sheet.hbs`,
      classes: [...options.classes, "rebellion", "item", "team"],
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
      isTeam: true,
      type: game.i18n.localize("PF1RS.Team"),
      isUnique: item.system.subType === "unique",
      enrichedDesc: await TextEditor.enrichHTML(item.system.description),
    };

    data.states = [
      {
        field: "system.disabled",
        value: item.system.disabled,
        label: game.i18n.localize("PF1RS.Disabled"),
      },
      {
        field: "system.missing",
        value: item.system.missing,
        label: game.i18n.localize("PF1RS.Missing"),
      },
    ];

    // sub-types
    const subTypeChoices = {};
    Object.entries(teamSubTypes).forEach(([key, label]) => (subTypeChoices[key] = game.i18n.localize(label)));
    data.subTypeChoices = subTypeChoices;

    // team types
    const baseTypeChoices = { "": "" };
    Object.entries(teamBaseTypes).forEach(([key, label]) => (baseTypeChoices[key] = game.i18n.localize(label)));
    data.baseTypeChoices = baseTypeChoices;

    // manager choices, only officers from parent sheet can be managers
    const managerChoices = { "": "" };
    if (item.parent) {
      Object.values(item.parent.system.officers).forEach((officer) => (managerChoices[officer.actorId] = officer.name));
    }
    data.validManagerChoices = managerChoices;

    // actions
    data.actions = item.system.actions.value.map((action) => game.i18n.localize(actions[action])).join(", ");

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".edit-actions").on("click", () => this._onActionsEdit());
  }

  _onActionsEdit() {
    const choices = Object.fromEntries(Object.entries(actions).map(([key, label]) => [key, game.i18n.localize(label)]));

    const app = new pf1.applications.ActorTraitSelector(this.item, {
      name: "system.actions",
      title: "Test2",
      subject: "actions",
      choices,
    });
    app.render(true, { focus: true });
  }
}
