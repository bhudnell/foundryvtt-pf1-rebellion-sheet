import { keepUpdateArray } from "../../util/utils.mjs";

export class BaseActor extends pf1.documents.actor.ActorBasePF {
  constructor(...args) {
    super(...args);

    if (this.itemFlags === undefined) {
      /**
       * Init item flags.
       */
      this.itemFlags = { boolean: {}, dictionary: {} };
    }

    if (this.changeItems === undefined) {
      /**
       * A list of all the active items with changes.
       *
       * @type {ItemPF[]}
       */
      this.changeItems = [];
    }

    if (this.changes === undefined) {
      /**
       * Stores all ItemChanges from carried items.
       *
       * @public
       * @type {Collection<ItemChange>}
       */
      this.changes = new Collection();
    }

    if (this._rollData === undefined) {
      /**
       * Cached roll data for this item.
       *
       * @internal
       * @type {object}
       */
      this._rollData = null;
    }
  }

  applyActiveEffects() {
    // Apply active effects. Required for status effects in v11 and onward, such as blind and invisible.
    super.applyActiveEffects();

    this._prepareChanges();
  }

  prepareBaseData() {
    this._initialized = false;
    super.prepareBaseData();

    /** @type {Record<string, SourceInfo>} */
    this.sourceInfo = {};
    this.changeFlags = {};
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    delete this._rollData;
    pf1.documents.actor.changes.applyChanges.call(this);

    this._initialized = true;
    this._setSourceDetails();
  }

  get _skillTargets() {
    return [];
  }

  refreshDerivedData() {}

  /**
   * Retrieve data used to fill in roll variables.
   *
   * @example
   * await new Roll("1d20 + \@abilities.wis.mod[Wis]", actor.getRollData()).toMessage();
   *
   * @override
   * @param {object} [options] - Additional options
   * @returns {object}
   */
  getRollData(options = { refresh: false }) {
    // Return cached data, if applicable
    const skipRefresh = !options.refresh && this._rollData;

    const result = { ...(skipRefresh ? this._rollData : foundry.utils.deepClone(this.system)) };

    /* ----------------------------- */
    /* Always add the following data
    /* ----------------------------- */

    // Add combat round, if in combat
    if (game.combats?.viewed) {
      result.combat = {
        round: game.combat.round || 0,
      };
    }

    // Return cached data, if applicable
    if (skipRefresh) {
      return result;
    }

    /* ----------------------------- */
    /* Set the following data on a refresh
    /* ----------------------------- */

    // Add item dictionary flags
    result.dFlags = this.itemFlags?.dictionary ?? {};
    result.bFlags = Object.fromEntries(
      Object.entries(this.itemFlags?.boolean ?? {}).map(([key, { sources }]) => [key, sources.length > 0 ? 1 : 0])
    );

    this._rollData = result;

    return result;
  }

  /**
   * @internal
   * @param {SourceInfo} src - Source info
   */
  static _getSourceLabel(src) {
    return src.name;
  }

  formatContextNotes(notes, rollData, { roll = true } = {}) {
    const result = [];
    rollData ??= this.getRollData();
    for (const noteObj of notes) {
      rollData.item = {};
      if (noteObj.item != null) {
        rollData = noteObj.item.getRollData();
      }

      for (const note of noteObj.notes) {
        result.push(
          ...note.split(/[\n\r]+/).map((subNote) =>
            pf1.utils.enrichHTMLUnrolled(subNote, {
              rollData,
              rolls: roll,
              relativeTo: this,
            })
          )
        );
      }
    }
    return result;
  }

  get allNotes() {
    const allNotes = this.items
      .filter(
        (item) =>
          item.type.startsWith(`${pf1rs.config.moduleId}.`) && item.isActive && item.system.contextNotes?.length > 0
      )
      .map((item) => {
        const notes = [];
        notes.push(...(item.system.contextNotes ?? []));
        return { notes, item };
      });

    return allNotes;
  }

  getContextNotes(context, settlementId) {
    if (context.string) {
      context = context.string;
    }
    const result = this.allNotes;

    for (const note of result) {
      note.notes = note.notes
        .filter((o) => o.target === context && o.parent.system.settlementId === settlementId)
        .map((o) => o.text);
    }

    return result.filter((n) => n.notes.length);
  }

  getContextNotesParsed(context, { roll = true } = {}) {
    const noteObjects = this.getContextNotes(context);
    return noteObjects.reduce((cur, o) => {
      for (const note of o.notes) {
        const enrichOptions = {
          rollData: o.item != null ? o.item.getRollData() : this.getRollData(),
          rolls: roll,
          async: false,
          relativeTo: this,
        };
        cur.push(pf1.utils.enrichHTMLUnrolled(note, enrichOptions));
      }

      return cur;
    }, []);
  }

  _prepareChanges() {
    const changes = [];

    this._addDefaultChanges(changes);

    this.changeItems = this.items.filter(
      (item) => item.type.startsWith(`${pf1rs.config.moduleId}.`) && item.hasChanges && item.isActive
    );

    for (const i of this.changeItems) {
      changes.push(...i.changes);
    }

    const c = new Collection();
    for (const change of changes) {
      // Avoid ID conflicts
      const parentId = change.parent?.id ?? "Actor";
      const uniqueId = `${parentId}-${change._id}`;
      c.set(uniqueId, change);
    }
    this.changes = c;
  }
}
