import { ItemBaseModel } from "./itemBaseModel.mjs";

export class AllyModel extends ItemBaseModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      rActions: new fields.SchemaField({
        value: new fields.ArrayField(new fields.StringField()),
      }),
    };
    this.addDefaultSchemaFields(schema);

    return schema;
  }

  static migrateData(data) {
    super.migrateData(data);

    if (data.actions?.value.length) {
      data.rActions = { value: data.actions.value };
    }
  }

  prepareDerivedData() {}
}
