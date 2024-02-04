export class TeamModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      cost: new fields.NumberField(),
      recruitment: new fields.SchemaField({
        dc: new fields.NumberField(),
        ability: new fields.StringField(),
      }),
      actions: new fields.ArrayField(new fields.StringField()),
      size: new fields.NumberField({ integer: true }),
      description: new fields.HTMLField(),
      team: new fields.StringField(),
      manager: new fields.StringField(),
      bonus: new fields.NumberField({ integer: true }),
      conditions: new fields.SchemaField({
        disabled: new fields.BooleanField({ initial: false }),
        missing: new fields.BooleanField({ initial: false }),
      }),
    };
  }

  prepareDerivedData() {}
}
