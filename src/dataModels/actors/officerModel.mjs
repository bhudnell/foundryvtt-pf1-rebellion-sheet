export function defineOfficer(role) {
  return class OfficerModel extends foundry.abstract.DataModel {
    _initialize(...args) {
      super._initialize(...args);

      if (!this.role) {
        this.role = role;
      }
    }

    static defineSchema() {
      const fields = foundry.data.fields;

      return {
        id: new fields.StringField({
          blank: false,
          initial: () => foundry.utils.randomID(),
          required: true,
          readonly: true,
        }),
        actorId: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
        role: new fields.StringField({ choices: Object.keys(pf1rs.config.officerRoles) }),
      };
    }

    get name() {
      const officer = game.actors.get(this.actorId);

      if (!officer) {
        return undefined;
      }

      return officer.name;
    }

    get bonus() {
      const officer = game.actors.get(this.actorId);

      if (!officer) {
        return 0;
      }

      switch (this.role) {
        case "demagogue":
          return Math.max(officer.system.abilities.con.mod, officer.system.abilities.cha.mod);
        case "partisan":
          return Math.max(officer.system.abilities.str.mod, officer.system.abilities.wis.mod);
        case "recruiter":
          return officer.system.attributes.hd.total;
        case "sentinel":
          return 1;
        case "spymaster":
          return Math.max(officer.system.abilities.dex.mod, officer.system.abilities.int.mod);
        case "strategist":
          return 1;
        default:
          return 0;
      }
    }

    get maxTeams() {
      const officer = game.actors.get(this.actorId);

      if (!officer) {
        return 0;
      }

      const hasNbl = officer.itemTypes.feat.some(
        (i) => i.name.includes("Natural Born Leader") && i.system.subType === "trait"
      );

      const chaMod = hasNbl ? Math.max(2, officer.system.abilities.cha.mod + 1) : officer.system.abilities.cha.mod;

      return Math.max(0, chaMod);
    }
  };
}
