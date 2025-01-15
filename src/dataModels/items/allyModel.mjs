import { ItemBaseModel } from "./itemBaseModel.mjs";

export class AllyModel extends ItemBaseModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      actions: new fields.SchemaField({
        value: new fields.ArrayField(new fields.StringField()),
      }),
    };
    this.addDefaultSchemaFields(schema);

    return schema;
  }

  prepareDerivedData() {}
}
