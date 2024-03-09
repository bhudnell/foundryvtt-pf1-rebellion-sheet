import { CFG } from "../config.mjs";

export class EventModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.HTMLField(),
      persistent: new fields.BooleanField({ initial: false }),
      mitigated: new fields.BooleanField({ initial: false }),
      changes: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField(),
          ability: new fields.StringField(),
          bonus: new fields.NumberField({ integer: true }),
        })
      ),
    };
  }

  prepareDerivedData() {}

  prepareBaseData() {
    if (!this.parent.effects.find((ae) => ae.getFlag(CFG.id, "changes") === true)) {
      ActiveEffect.create(
        { name: "Effect Changes", transfer: true, flags: { [CFG.id]: { changes: true } } },
        { parent: this.parent, render: false }
      );
    }
  }
}
