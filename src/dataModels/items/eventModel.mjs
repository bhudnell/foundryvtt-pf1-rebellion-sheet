import { eventSubTypes } from "../../config/config.mjs";

import { ItemBaseModel } from "./itemBaseModel.mjs";

export class EventModel extends ItemBaseModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      subType: new fields.StringField({ initial: "active", choices: Object.keys(eventSubTypes) }),
      persistent: new fields.BooleanField({ initial: false }),
      mitigated: new fields.BooleanField({ initial: false }),
    };
    this.addDefaultSchemaFields(schema);

    return schema;
  }

  prepareDerivedData() {}
}
