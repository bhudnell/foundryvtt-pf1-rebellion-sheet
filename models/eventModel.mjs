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
}
