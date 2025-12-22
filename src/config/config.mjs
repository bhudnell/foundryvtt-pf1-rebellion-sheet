export const moduleId = "pf1-rebellion-sheet";
export const changePrefix = "pf1rs";

export const sheetId = `${moduleId}.rebellion`;

export const allyId = `${moduleId}.ally`;
export const eventId = `${moduleId}.event`;
export const teamId = `${moduleId}.team`;

export const itemTypes = [allyId, eventId, teamId];

// rank: maxActions
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
};

// rank: maxTeams
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
};

export const teamBaseTypes = {
  stp: {
    name: "PF1RS.Teams.StreetPerformers",
    tier: 1,
    size: 6,
    grantedActions: ["gi"],
  },
  rum: {
    name: "PF1RS.Teams.Rumormongers",
    tier: 2,
    size: 6,
    grantedActions: ["gi", "sd"],
  },
  agi: {
    name: "PF1RS.Teams.Agitators",
    tier: 3,
    size: 6,
    grantedActions: ["gi", "sd", "ui"],
  },
  cog: {
    name: "PF1RS.Teams.Cognoscenti",
    tier: 3,
    size: 6,
    grantedActions: ["gi", "sd", "kc"],
  },
  sne: {
    name: "PF1RS.Teams.Sneaks",
    tier: 1,
    size: 3,
    grantedActions: ["sc"],
  },
  thi: {
    name: "PF1RS.Teams.Thieves",
    tier: 2,
    size: 3,
    grantedActions: ["sc", "ash"],
  },
  sab: {
    name: "PF1RS.Teams.Saboteurs",
    tier: 3,
    size: 3,
    grantedActions: ["sc", "ash", "sab"],
  },
  spi: {
    name: "PF1RS.Teams.Spies",
    tier: 3,
    size: 3,
    grantedActions: ["sc", "ash", "ca"],
  },
  ffi: {
    name: "PF1RS.Teams.FreedomFighters",
    tier: 1,
    size: 6,
    grantedActions: ["rd"],
  },
  inf: {
    name: "PF1RS.Teams.Infiltrators",
    tier: 2,
    size: 6,
    grantedActions: ["rd", "rcc"],
  },
  cab: {
    name: "PF1RS.Teams.Cabalists",
    tier: 3,
    size: 6,
    grantedActions: ["rd", "rcc", "me"],
  },
  spe: {
    name: "PF1RS.Teams.Spellcasters",
    tier: 3,
    size: 6,
    grantedActions: ["rd", "rcc", "rtc"],
  },
  ped: {
    name: "PF1RS.Teams.Peddlers",
    tier: 1,
    size: 6,
    grantedActions: ["eg"],
  },
  mer: {
    name: "PF1RS.Teams.Merchants",
    tier: 2,
    size: 6,
    grantedActions: ["eg", "rm"],
  },
  blm: {
    name: "PF1RS.Teams.BlackMarketers",
    tier: 3,
    size: 6,
    grantedActions: ["eg", "rm", "abm"],
  },
  mel: {
    name: "PF1RS.Teams.MerchantLords",
    tier: 3,
    size: 6,
    grantedActions: ["eg", "rm", "so"],
  },
  custom: {
    name: "PF1RS.Teams.Custom",
  },
};

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
};

export const actionCompendiumEntries = {
  abm: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.npdocimLRevIbHeF",
  ash: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.d4pd0FEYdEz79vVw",
  cor: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.fkVqaDZmKnnCmu5R",
  ca: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.zWKvuFMQJhr9QQ02",
  dt: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.fW2qFuyyLZD0fSmk",
  eg: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.U4PvxxtchivVg1uE",
  gi: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.4QG1oubvw1DLiNjt",
  ge: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.AUHUpjmtggSwpj8o",
  kc: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.T4Oyc6DSXbCwXhhs",
  ll: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.RhQvHUwfRUjGbme8",
  me: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.zbzww6LnGqPIqID3",
  rs: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.9URQM0vRMNrT7pgH",
  rt: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.ji3LtQQlg2L37JpR",
  rd: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.1KDMTBjRKG4o62ay",
  rm: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.H39FXaqzdziHURhQ",
  rcc: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.XvU6yRcj770X77Lu",
  rtc: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.JNZQ8Brj94ilDzUq",
  sab: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.04wQsvaPHygnApHo",
  sc: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.Usl02IS8Za8dMSku",
  sa: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.qB0T4DCcL4F16XKm",
  so: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.XcU9pznsBay4etLJ",
  sd: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.zMEJt3qWPXfA0SIb",
  ut: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.A0Xh9HGSv1cyowlO",
  ui: "Compendium.pf1-rebellion-sheet.rules.JournalEntry.3VTskkxbkAScVTyI.JournalEntryPage.hqEctNHW0IsJMgRZ",
};

export const alwaysAvailableActions = ["cor", "dt", "ge", "ll", "rs", "rt", "sa", "ut"];

export const events = {
  ac: "PF1RS.Events.AllCalm",
  ap: "PF1RS.Events.AllyPeril",
  cd: "PF1RS.Events.CacheDiscovered",
  dat: "PF1RS.Events.DangerousTimes",
  di: "PF1RS.Events.DiabolicInfiltration",
  dp: "PF1RS.Events.DiminishedPeril",
  dit: "PF1RS.Events.DisabledTeam",
  dm: "PF1RS.Events.DisastrousMission",
  dr: "PF1RS.Events.DissensionRanks",
  don: "PF1RS.Events.Donation",
  fp: "PF1RS.Events.FailedProtest",
  ip: "PF1RS.Events.IncreasedPatrols",
  is: "PF1RS.Events.IncreasedSupport",
  inq: "PF1RS.Events.Inquisition",
  inv: "PF1RS.Events.Invasion",
  lm: "PF1RS.Events.LowMorale",
  mb: "PF1RS.Events.MarketplaceBoom",
  ma: "PF1RS.Events.MissingAction",
  riv: "PF1RS.Events.Rivalry",
  sic: "PF1RS.Events.Sickness",
  sni: "PF1RS.Events.Snitch",
  sp: "PF1RS.Events.SuccessfulProtest",
  tra: "PF1RS.Events.Traitor",
  ws: "PF1RS.Events.WeekSecrecy",
};

export const eventCompendiumEntries = {
  ac: "Compendium.pf1-rebellion-sheet.events.Item.WQAQ5P7T5szm48CA",
  ap: "Compendium.pf1-rebellion-sheet.events.Item.tEQY5D2pdIdL2OcO",
  cd: "Compendium.pf1-rebellion-sheet.events.Item.ZYDsr0wi1orOz21f",
  dat: "Compendium.pf1-rebellion-sheet.events.Item.XYaqJw9bEeKA2UzS",
  di: "Compendium.pf1-rebellion-sheet.events.Item.LqzaDrnko5Zb29zV",
  dp: "Compendium.pf1-rebellion-sheet.events.Item.02OS1xJM1wX1zpxl",
  dit: "Compendium.pf1-rebellion-sheet.events.Item.57Gca5ToAv7oSvwl",
  dm: "Compendium.pf1-rebellion-sheet.events.Item.ex6mYwTUGshmVF3i",
  dr: "Compendium.pf1-rebellion-sheet.events.Item.h1vrvgrvfzLxhs7D",
  don: "Compendium.pf1-rebellion-sheet.events.Item.lkYH031D7OdFTgp6",
  fp: "Compendium.pf1-rebellion-sheet.events.Item.hs1MANfE5FwB7NcV",
  ip: "Compendium.pf1-rebellion-sheet.events.Item.MWALLXlDMI0HlXYw",
  is: "Compendium.pf1-rebellion-sheet.events.Item.jXwzHOEt5ZjPgpD0",
  inq: "Compendium.pf1-rebellion-sheet.events.Item.XwQ0lsVCporBsPJC",
  inv: "Compendium.pf1-rebellion-sheet.events.Item.Oz5bY8eIknuA6q4N",
  lm: "Compendium.pf1-rebellion-sheet.events.Item.Dwuum6chASrAjU0c",
  mb: "Compendium.pf1-rebellion-sheet.events.Item.Rj3WbRvp6iqttjYj",
  ma: "Compendium.pf1-rebellion-sheet.events.Item.yfQ2MKk3HJLVXzek",
  riv: "Compendium.pf1-rebellion-sheet.events.Item.cRshqPd4ekGo2iaX",
  sic: "Compendium.pf1-rebellion-sheet.events.Item.MBxYtg03e0PbGF54",
  sni: "Compendium.pf1-rebellion-sheet.events.Item.0K9GzKA1Xt7VfHwv",
  sp: "Compendium.pf1-rebellion-sheet.events.Item.h4VNzwCFcu5KNadh",
  tra: "Compendium.pf1-rebellion-sheet.events.Item.UJ24TyXWllMaQ36S",
  ws: "Compendium.pf1-rebellion-sheet.events.Item.bfGS8MSyschn3CbI",
};

export const officerRoles = {
  demagogue: "PF1RS.Demagogue",
  partisan: "PF1RS.Partisan",
  sentinel: "PF1RS.Sentinel",
  spymaster: "PF1RS.Spymaster",
  strategist: "PF1RS.Strategist",
  recruiter: "PF1RS.Recruiter",
};

export const officerBonuses = {
  demagogue: "PF1RS.Loyalty",
  partisan: "PF1RS.Security",
  recruiter: "PF1RS.Supporters",
  sentinel: "PF1RS.OfficerBonusSecondary",
  spymaster: "PF1RS.Secrecy",
  strategist: "PF1RS.OfficerBonusAction",
};

export const orgChecks = {
  loyalty: "PF1RS.Loyalty",
  secrecy: "PF1RS.Secrecy",
  security: "PF1RS.Security",
};

export const orgCheckOfficer = {
  loyalty: "demagogue",
  secrecy: "spymaster",
  security: "partisan",
};

export const orgOfficers = {
  loyalty: "PF1RS.Demagogue",
  secrecy: "PF1RS.Spymaster",
  security: "PF1RS.Partisan",
};

export const eventSubTypes = {
  active: "PF1.Subtypes.Item.pf1-rebellion-sheet.event.active.Plural",
  misc: "PF1.Subtypes.Item.pf1-rebellion-sheet.event.misc.Plural",
};

export const teamSubTypes = {
  general: "PF1.Subtypes.Item.pf1-rebellion-sheet.team.general.Plural",
  unique: "PF1.Subtypes.Item.pf1-rebellion-sheet.team.unique.Plural",
};
