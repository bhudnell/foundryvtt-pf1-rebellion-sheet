export class AllyModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.HTMLField(),
      changes: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField(),
          ability: new fields.StringField(),
          bonus: new fields.NumberField({ integer: true }),
        })
      ),
      actions: new fields.SchemaField({
        value: new fields.ArrayField(new fields.StringField()),
      }),
    };
  }

  prepareDerivedData() {}
}
