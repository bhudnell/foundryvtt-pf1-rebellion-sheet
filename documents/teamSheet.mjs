import { CFG, actions, teamSubTypes, teamBaseTypes } from "../config.mjs";

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

    const data = {
      ...item,
      enrichedDesc: await TextEditor.enrichHTML(item.system.description),
    };

    // sub-types
    const subTypeChoices = {};
    Object.entries(teamSubTypes).forEach(([key, label]) => (subTypeChoices[key] = game.i18n.localize(label)));
    data.subTypeChoices = subTypeChoices;

    // team types
    const baseTypeChoices = { "": "" };
    Object.entries(teamBaseTypes).forEach(([key, label]) => (baseTypeChoices[key] = game.i18n.localize(label)));
    data.baseTypeChoices = baseTypeChoices;

    // manager choices TODO maybe only change from rebellion sheet?
    // TODO only officers on parent sheet can be managers
    const managerChoices = { "": "" };
    game.actors
      .filter((actor) => actor.permission > 0 && (actor.type === "character" || actor.type === "npc"))
      .forEach((actor) => (managerChoices[actor.id] = actor.name));
    data.validManagerChoices = managerChoices;

    // actions
    data.actionLabels = item.system.actions.value.map((action) => game.i18n.localize(actions[action]));

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".edit-actions").click(() => this._onActionsEdit());
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
