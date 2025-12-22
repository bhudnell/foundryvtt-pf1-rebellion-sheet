import { ItemBaseModel } from "./itemBaseModel.mjs";

export class TeamModel extends ItemBaseModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      subType: new fields.StringField({ initial: "general", choices: Object.keys(pf1rs.config.teamSubTypes) }),
      baseType: new fields.StringField({ blank: true, choices: Object.keys(pf1rs.config.teamBaseTypes) }),
      customTier: new fields.NumberField({ integer: true }),
      customActions: new fields.ArrayField(new fields.StringField()),
      customSize: new fields.NumberField({ integer: true }),
      managerId: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
      disabled: new fields.BooleanField({ initial: false }),
      missing: new fields.BooleanField({ initial: false }),
    };
    this.addDefaultSchemaFields(schema);

    return schema;
  }

  static migrateData(data) {
    super.migrateData(data);

    if (data.actions?.value.length) {
      data.customActions = { value: data.actions.value };
    }

    if (data.customActions?.value) {
      data.customActions = data.customActions.value;
    }
  }

  prepareDerivedData() {}

  get rActions() {
    if (this.subType === "unique" || this.baseType === "custom") {
      return this.customActions;
    }
    return pf1rs.config.teamBaseTypes[this.baseType]?.grantedActions ?? [];
  }

  get tier() {
    if (this.subType === "unique" || this.baseType === "custom") {
      return this.customTier;
    }
    return pf1rs.config.teamBaseTypes[this.baseType]?.tier ?? 0;
  }

  get size() {
    if (this.subType === "unique" || this.baseType === "custom") {
      return this.customSize;
    }
    return pf1rs.config.teamBaseTypes[this.baseType]?.size ?? 0;
  }

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
      (i) => i.name === game.i18n.localize("PF1RS.Leadership") && i.system.subType === "feat"
    );
    const hasNbl = managerActor.itemTypes.feat.some(
      (i) => i.name.includes(game.i18n.localize("PF1RS.NaturalBornLeader")) && i.system.subType === "trait"
    );

    const chaMod = hasNbl
      ? Math.max(2, managerActor.system.abilities.cha.mod + 1)
      : managerActor.system.abilities.cha.mod;

    return Math.max(0, chaMod) + (hasLeadership ? 2 : 0);
  }
}
