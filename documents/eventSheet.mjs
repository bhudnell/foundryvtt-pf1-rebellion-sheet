import { CFG } from '../config.mjs'

export class EventSheet extends ItemSheet {
	static get defaultOptions() {
		const options = super.defaultOptions;
		return {
			...options,
			template: `modules/${CFG.id}/templates/event-sheet.hbs`,
			classes: [...options.classes, 'rebellion', 'event'],
		}
	}

	async getData() {
		const item = this.item;
		
		const context = {
			...item,
			enrichedDesc: await TextEditor.enrichHTML(item.system.description),
		}

		return context;
	}
}