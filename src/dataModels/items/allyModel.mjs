import { ItemBaseModel } from "./itemBaseModel.mjs";

export class AllyModel extends ItemBaseModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      rActions: new fields.ArrayField(new fields.StringField()),
    };
    this.addDefaultSchemaFields(schema);

    return schema;
  }

  static migrateData(data) {
    super.migrateData(data);

    if (data.actions?.value.length) {
      data.rActions = { value: data.actions.value };
    }

    if (data.rActions?.value) {
      data.rActions = data.rActions.value;
    }
  }

  prepareDerivedData() {}
}
