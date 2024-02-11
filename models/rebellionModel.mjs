import { maxActions, maxTeams, orgChecks } from "../config.mjs";

function defineOfficer(initial = 0) {
  const fields = foundry.data.fields;

  return new fields.SchemaField({
    name: new fields.StringField(),
    bonus: new fields.NumberField({ integer: true, initial, nullable: false }),
  });
}

export class RebellionModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      details: new fields.SchemaField({
        rank: new fields.NumberField({
          integer: true,
          min: 1,
          max: 20,
          initial: 1,
          nullable: false,
        }),
        maxRank: new fields.NumberField({
          integer: true,
          min: 5,
          max: 20,
          initial: 5,
          nullable: false,
        }),
        focus: new fields.StringField({
          blank: true,
          choices: Object.keys(orgChecks),
        }),
        membership: new fields.NumberField({
          integer: true,
          min: 0,
          initial: 0,
          nullable: false,
        }),
        supporters: new fields.NumberField({
          integer: true,
          min: 0,
          initial: 0,
          nullable: false,
        }),
        population: new fields.NumberField({
          integer: true,
          min: 0,
          initial: 11900,
          nullable: false,
        }),
        treasury: new fields.NumberField({
          integer: true,
          initial: 10,
          nullable: false,
        }),
        notoriety: new fields.NumberField({
          integer: true,
          min: 0,
          max: 100,
          initial: 0,
          nullable: false,
        }),
        danger: new fields.NumberField({
          integer: true,
          initial: 20,
          nullable: false,
        }),
      }),
      officers: new fields.SchemaField({
        demagogue: new fields.SchemaField({
          id: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
        }),
        partisan: new fields.SchemaField({
          id: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
        }),
        recruiter: new fields.SchemaField({
          id: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
        }),
        sentinel: new fields.SchemaField({
          id: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
        }),
        spymaster: new fields.SchemaField({
          id: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
        }),
        strategist: new fields.SchemaField({
          id: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
        }),
      }),
      doubleEventChance: new fields.BooleanField({ initial: false }),
    };
  }

  prepareDerivedData() {
    // organization checks
    this.focusBase = Math.floor(this.details.rank / 2) + 2;
    this.secondaryBase = Math.floor(this.details.rank / 3);

    // other details
    this.minTreasury = this.details.rank * 10;
    this.maxActions = maxActions[this.details.rank] + (this.officers.strategist.id ? 1 : 0);
    this.maxTeams = maxTeams[this.details.rank];
  }
}
