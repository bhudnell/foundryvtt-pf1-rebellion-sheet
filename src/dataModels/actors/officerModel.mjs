export function defineOfficer(type) {
  return class OfficerModel extends foundry.abstract.DataModel {
    static defineSchema() {
      const fields = foundry.data.fields;

      return {
        actorId: new fields.ForeignDocumentField(pf1.documents.actor.ActorPF, { idOnly: true }),
      };
    }

    _initialize(...args) {
      super._initialize(...args);

      this.type = type;
      this.id = foundry.utils.randomID();
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

      switch (this.type) {
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
