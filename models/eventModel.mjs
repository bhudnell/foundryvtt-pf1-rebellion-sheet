export class EventModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.HTMLField(),
			persistent: new fields.BooleanField({initial: false})
		}
	}

	prepareDerivedData() {}
}