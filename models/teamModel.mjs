export class TeamModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			cost: new fields.NumberField(),
			recruitment: new fields.SchemaField({
				dc: new fields.NumberField(),
				ability: new fields.StringField()
			}),
			actions: new fields.ArrayField(new fields.StringField()),
			description: new fields.HTMLField(),
			details: new fields.SchemaField({
				team: new fields.StringField(),
				manager: new fields.StringField(),
				size: new fields.NumberField({ integer: true, initial: 0, nullable: false }),
				bonus: new fields.NumberField({ integer: true, initial: 0, nullable: false }),
			}),
			conditions: new fields.SchemaField({
				disabled: new fields.BooleanField({initial: false}),
				missing: new fields.BooleanField({initial: false}),
			}),
		}
	}

	prepareDerivedData() {}
}