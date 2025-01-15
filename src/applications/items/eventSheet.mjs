import { CFG, allChangeTargets, eventSubTypes } from "../../config/config.mjs";
import { getChangeCategories } from "../../util/utils.mjs";

import { ItemBaseSheet } from "./itemBaseSheet.mjs";

export class EventSheet extends ItemBaseSheet {
  async getData(options = {}) {
    const itemData = this.item.system;
    const context = await super.getData(options);

    // sub-types
    context.subTypeOptions = pf1rs.config.eventSubTypes;

    // sidebar info
    if (itemData.subType === "active") {
      context.states = [
        {
          field: "system.persistent",
          value: itemData.persistent,
          label: game.i18n.localize("PF1RS.Persistent"),
        },
        {
          field: "system.mitigated",
          value: itemData.mitigated,
          label: game.i18n.localize("PF1RS.Mitigated"),
        },
      ];
    }

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".sub-type-selector").on("change", (e) => this._onSubTypeChange(e));
  }

  _onSubTypeChange(event) {
    if (event.target.value === "misc") {
      this.item.update({ "system.persistent": false, "system.mitigated": false });
    }
  }
}
