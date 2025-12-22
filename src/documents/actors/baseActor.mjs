export class BaseActor extends pf1.documents.actor.ActorBasePF {
  _configure(options = {}) {
    super._configure(options);

    /**
     * Stores all ItemChanges from carried items.
     *
     * @public
     * @type {Collection<ItemChange>}
     */
    this.changes ??= new Collection();

    /**
     * Cached roll data for this item.
     *
     * @internal
     * @type {object}
     */
    Object.defineProperties(this, {
      itemFlags: {
        value: { boolean: {}, dictionary: {} },
        writable: false,
      },
      _rollData: {
        value: null,
        enumerable: false,
        writable: true,
      },
      _visionSharingSheet: {
        value: null,
        enumerable: false,
        writable: true,
      },
    });
  }

  /**
   * @internal
   * @param {SourceInfo} src - Source info
   */
  static _getSourceLabel(src) {
    return src.name;
  }

  get _skillTargets() {
    return [];
  }

  _prepareChanges() {
    const changes = [];

    this._prepareTypeChanges(changes);

    for (const item of this.items) {
      if (item.type.startsWith(`${pf1rs.config.moduleId}.`) && item.isActive && item.hasChanges && item.changes.size) {
        changes.push(...item.changes);
      }
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

  _prepareTypeChanges(changes) {}

  _prepareRActions() {}

  applyActiveEffects() {
    // Apply active effects. Required for status effects in v11 and onward, such as blind and invisible.
    super.applyActiveEffects();

    this._prepareChanges();

    this._prepareRActions();

    pf1.documents.actor.changes.applyChanges(this, { simple: true });
  }

  prepareBaseData() {
    super.prepareBaseData();

    /** @type {Record<string, SourceInfo>} */
    this.sourceInfo = {};
    this.changeFlags = {};
  }

  refreshDerivedData() {}

  prepareDerivedData() {
    super.prepareDerivedData();

    pf1.documents.actor.changes.applyChanges(this);

    this._rollData = null;
  }

  getSourceDetails(path) {
    const sources = [];

    // Add extra data
    const rollData = this.getRollData();
    const changeGrp = this.sourceInfo[path] ?? {};
    const sourceGroups = Object.values(changeGrp);

    for (const grp of sourceGroups) {
      for (const src of grp) {
        src.operator ||= "add";
        let srcValue =
          src.value != null
            ? src.value
            : pf1.dice.RollPF.safeRollSync(src.formula || "0", rollData, [path, src, this], {
                suppressError: !this.isOwner,
              }).total;
        if (src.operator === "set") {
          srcValue = game.i18n.format("PF1.SetTo", { value: srcValue });
        }

        // Add sources only if they actually add something else than zero
        if (!(src.operator === "add" && srcValue === 0) || src.ignoreNull === false) {
          const label = this.constructor._getSourceLabel(src);
          const info = { name: label.replace(/[[\]]/g, ""), value: srcValue, modifier: src.modifier || null };
          sources.push(info);
        }
      }
    }

    return sources;
  }

  _getContextEntries(field) {
    return this.items
      .filter(
        (item) => item.type.startsWith(`${pf1rs.config.moduleId}.`) && item.isActive && item.system[field]?.length > 0
      )
      .map((item) => ({ entries: item.system[field], item }));
  }

  _getEntriesForContext(field, context) {
    const result = this._getContextEntries(field);

    for (const obj of result) {
      obj.entries = obj.entries.filter((e) => e.target === context).map((e) => e.text);
    }

    return result.filter((o) => o.entries.length);
  }

  async _enrichEntries(objects, rollData, { roll = true } = {}) {
    rollData ??= this.getRollData();

    await Promise.all(
      objects.map(async (obj) => {
        let localRollData = rollData;

        if (obj.item) {
          localRollData = obj.item.getRollData();
        }

        const enriched = [];
        for (const entry of obj.entries) {
          enriched.push(
            ...entry.split(/[\n\r]+/).map((sub) =>
              pf1.utils.enrichHTMLUnrolled(sub, {
                rollData: localRollData,
                rolls: roll,
                relativeTo: this,
              })
            )
          );
        }

        obj.enriched = await Promise.all(enriched);
      })
    );
  }

  async _getEntriesParsed(field, context, { roll = true, rollData } = {}) {
    rollData ??= this.getRollData();

    const objects = this._getEntriesForContext(field, context);
    await this._enrichEntries(objects, rollData, { roll });

    return objects.flatMap((o) =>
      o.enriched.map((text) => ({
        text,
        source: o.item?.name,
      }))
    );
  }

  async getContextNotesParsed(context, { all, roll = true, rollData } = {}) {
    return this._getEntriesParsed("contextNotes", context, { all, roll, rollData });
  }

  async getEventImmunitiesParsed(context, { all, roll = true, rollData } = {}) {
    return this._getEntriesParsed("eventImmunities", context, { all, roll, rollData });
  }

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
}
