import { teamSubTypes } from "../config.mjs";

export class TeamModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      subType: new fields.StringField({ initial: "general", choices: Object.keys(teamSubTypes) }),
      baseType: new fields.StringField(), // type of team from teamBaseType definition
      tier: new fields.NumberField(),
      cost: new fields.NumberField(),
      recruitment: new fields.SchemaField({
        dc: new fields.NumberField(),
        ability: new fields.StringField(),
      }),
      actions: new fields.SchemaField({
        value: new fields.ArrayField(new fields.StringField()),
      }),
      size: new fields.NumberField({ integer: true }),
      description: new fields.HTMLField(),
      managerId: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
      disabled: new fields.BooleanField({ initial: false }),
      missing: new fields.BooleanField({ initial: false }),
    };
  }

  prepareDerivedData() {}

  get managerName() {
    const managerActor = game.actors.get(this.managerId);

    if (!managerActor) {
      return undefined;
    }

    return managerActor.name;
  }

  get bonus() {
    const managerActor = game.actors.get(this.managerId);

    if (!managerActor) {
      return 0;
    }

    const hasLeadership = managerActor.itemTypes.feat.some(
      (i) => i.name === "Leadership" && i.system.subType === "feat"
    );
    const hasNbl = managerActor.itemTypes.feat.some(
      (i) => i.name.includes("Natural Born Leader") && i.system.subType === "trait"
    );

    const chaMod = hasNbl
      ? Math.max(2, managerActor.system.abilities.cha.mod + 1)
      : managerActor.system.abilities.cha.mod;

    return Math.max(0, chaMod) + (hasLeadership ? 2 : 0);
  }
}
