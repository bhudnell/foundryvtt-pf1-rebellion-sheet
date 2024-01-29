import { CFG, actions, alwaysAvailableActions, maxActions, officerBonuses, rebellionEventId, rebellionTeamId } from '../config.mjs'
import { getRankFromSupporters } from '../utils.mjs';

export class RebellionSheet extends ActorSheet {
	static get defaultOptions() {
		const options = super.defaultOptions;
		return {
			...options,
			template: `modules/${CFG.id}/templates/rebellion-sheet.hbs`,
			classes: [...options.classes, 'rebellion', 'sheet'],
			dragDrop: [{ dragSelector: '.item-list .item[data-item-id]', dropSelector: 'form' }]
		}
	}

	async getData() {
		const actor = this.actor;
		const actorData = actor.system;
		const context = {
			...this.actor,
			checks: [
				{ id: 'loyalty', label: game.i18n.localize('PF1RS.Rebellion.Loyalty'), officerLabel: game.i18n.localize('PF1RS.Rebellion.Demagogue') },
				{ id: 'secrecy', label: game.i18n.localize('PF1RS.Rebellion.Secrecy'), officerLabel: game.i18n.localize('PF1RS.Rebellion.Spymaster') },
				{ id: 'security', label: game.i18n.localize('PF1RS.Rebellion.Security'), officerLabel: game.i18n.localize('PF1RS.Rebellion.Partisan') },
			],
			officers: [
				{ id: 'demagogue', label: game.i18n.localize('PF1RS.Rebellion.Demagogue')},
				{ id: 'partisan', label: game.i18n.localize('PF1RS.Rebellion.Partisan')},
				{ id: 'recruiter', label: game.i18n.localize('PF1RS.Rebellion.Recruiter')},
				{ id: 'sentinel', label: game.i18n.localize('PF1RS.Rebellion.Sentinel')},
				{ id: 'spymaster', label: game.i18n.localize('PF1RS.Rebellion.Spymaster')},
				{ id: 'strategist', label: game.i18n.localize('PF1RS.Rebellion.Strategist')},
			]
		}

		// indicators
		context.rankUpIndicator = getRankFromSupporters(actorData.details.supporters) > actorData.details.rank && actorData.details.rank < actorData.details.maxRank;

		// Organization checks
		for (const abl of context.checks) {
			abl.data = actorData[abl.id];
			abl.data.other = 0 // TODO other
			abl.data.total = abl.data.base + abl.data.officer + abl.data.sentinel + abl.data.other
		}

		// available actions
		context.actions = {
			available: Object.entries(actions).map(([actionId, label]) => ({
				id: actionId,
				label: game.i18n.localize(label),
				available: alwaysAvailableActions.includes(actionId) // TODO check teams for more actions
			})),
			rank: maxActions[actorData.details.rank],
			strategist: actorData.officers.strategist.name ? 1 : 0
		}

		// officers
		for (const officer of context.officers) {
			officer.name = actorData.officers[officer.id].name;
			officer.bonus = actorData.officers[officer.id].bonus;
			officer.bonusType = game.i18n.localize(officerBonuses[officer.id]);
			officer.isInput = !['sentinel', 'strategist'].includes(officer.id);
		}

		// item types
		context.itemTypes = actor.itemTypes;
		context.teams = context.itemTypes[rebellionTeamId] ?? [];
		context.events = context.itemTypes[rebellionEventId] ?? [];

		console.log(context.events)
		return context;
	}

	_validateRank(e) {
		const result = Number(e.target.value)

		if (result < 1) {
			ui.notifications.warn('Cant be lower than 1')
			e.target.value = 1
		} else if (result > this.actor.system.details.maxRank) {
			ui.notifications.warn('Cant be higher than the max rank')
			e.target.value = this.actor.system.details.maxRank
		}
	}

	_validateSupporters(e) {
		const result = Number(e.target.value)

		if (result < 0) {
			ui.notifications.warn('Cant be lower than 0')
			e.target.value = 0
		} else if (result > this.actor.system.details.population) {
			ui.notifications.warn('Cant be higher than the current population')
			e.target.value = this.actor.system.details.population
		}
	}

	activateListeners(jq) {
		super.activateListeners(jq);

		const html = this.form

		html.querySelectorAll('input[name="system.details.rank"]').forEach(el => el.addEventListener('change', this._validateRank.bind(this)))
		html.querySelectorAll('input[name="system.details.supporters"]').forEach(el => el.addEventListener('change', this._validateSupporters.bind(this)))
	}
}