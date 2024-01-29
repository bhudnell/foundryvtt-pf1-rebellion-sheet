export const CFG = {
	id: 'pf1-rebellion-sheet'
};

export const rebellionSheetId = `${CFG.id}.rebellion`;
export const rebellionTeamId = `${CFG.id}.team`;
export const rebellionEventId = `${CFG.id}.event`;

export const maxActions = {
	1: 1,
	2: 2,
	3: 2,
	4: 2,
	5: 2,
	6: 2,
	7: 3,
	8: 3,
	9: 3,
	10: 3,
	11: 4,
	12: 4,
	13: 4,
	14: 4,
	15: 5,
	16: 5,
	17: 5,
	18: 5,
	19: 6,
	20: 6,
}

export const maxTeams = {
	1: 2,
	2: 2,
	3: 3,
	4: 3,
	5: 4,
	6: 4,
	7: 4,
	8: 5,
	9: 5,
	10: 5,
	11: 6,
	12: 6,
	13: 6,
	14: 6,
	15: 7,
	16: 7,
	17: 7,
	18: 7,
	19: 7,
	20: 8,
}

export const actions = {
	abm: "PF1RS.Actions.Abm",
	ash: "PF1RS.Actions.Ash",
	cor: "PF1RS.Actions.Cor",
	ca: "PF1RS.Actions.Ca",
	dt: "PF1RS.Actions.Dt",
	eg: "PF1RS.Actions.Eg",
	gi: "PF1RS.Actions.Gi",
	ge: "PF1RS.Actions.Ge",
	kc: "PF1RS.Actions.Kc",
	ll: "PF1RS.Actions.Ll",
	me: "PF1RS.Actions.Me",
	rs: "PF1RS.Actions.Rs",
	rt: "PF1RS.Actions.Rt",
	rd: "PF1RS.Actions.Rd",
	rm: "PF1RS.Actions.Rm",
	rcc: "PF1RS.Actions.Rcc",
	rtc: "PF1RS.Actions.Rtc",
	sab: "PF1RS.Actions.Sab",
	sc: "PF1RS.Actions.Sc",
	sa: "PF1RS.Actions.Sa",
	so: "PF1RS.Actions.So",
	sd: "PF1RS.Actions.Sd",
	ut: "PF1RS.Actions.Ut",
	ui: "PF1RS.Actions.Ui",
}

export const alwaysAvailableActions = ['cor', 'dt', 'ge', 'll', 'rs', 'rt', 'sa', 'ut']

export const officerBonuses = {
	demagogue: "PF1RS.Rebellion.Loyalty",
	partisan: "PF1RS.Rebellion.Security",
	recruiter: "PF1RS.Rebellion.Supporters",
	sentinel: "PF1RS.Rebellion.Secondary",
	spymaster: "PF1RS.Rebellion.Secrecy",
	strategist: "PF1RS.Common.Action",
}