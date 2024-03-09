import { CFG, changeTargets } from "../config.mjs";

export class EventSheet extends ItemSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    return {
      ...options,
      template: `modules/${CFG.id}/templates/event-sheet.hbs`,
      classes: [...options.classes, "rebellion", "event"],
    };
  }

  async getData() {
    this.changesAE = this.item.effects.find((ae) => ae.getFlag(CFG.id, "changes") === true);

    const item = this.item;

    const data = {
      ...item,
      enrichedDesc: await TextEditor.enrichHTML(item.system.description),
    };

    data.changes = this.changesAE?.changes ?? [];

    data.changeTargetOptions = Object.fromEntries(
      Object.entries(changeTargets).map(([key, label]) => [key, game.i18n.localize(label)])
    );

    console.log(this.changesAE);

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".add-change").click((e) => this._onAddChange(e));
    html.find(".edit-change").click((e) => this._onEditChange(e));
    html.find(".delete-change").click((e) => this._onDeleteChange(e));
  }

  async _onAddChange(event) {
    event.preventDefault();

    if (!this.changesAE) {
      console.error("No AE found. THis shouldnt happen");
    }

    const changes = foundry.utils.deepClone(this.changesAE.changes ?? []);
    changes.push({ key: "", value: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD });

    this.changesAE.update({ changes });
  }

  async _onEditChange(event) {
    event.preventDefault();

    await Dialog.wait(
      {
        title: game.i18n.format("PF1RS.UpdateChangeTitle", { name: this.item.name }),
        content: `<form>
        <div class="form-group-stacked">
          <label>Stability Check:</label>
          <div class="form-fields">
            <input type="radio" name="stabilityResult" value="unrestm1" id="unrestm1">
            <label for="unrestm1">-1 Unrest</label>
            <input type="radio" name="stabilityResult" value="bpp1" id="bpp1">
            <label for="bpp1">+1 BP</label>
            <input type="radio" name="stabilityResult" value="unrestp1" id="unrestp1">
            <label for="unrestp1">Fail < 5, +1 Unrest</label>
            <input type="radio" name="stabilityResult" value="unrestp1d4" id="unrestp1d4">
            <label for="unrestp1d4">Fail >= 5, +1d4 Unrest</label>
          </div>
        </div>
        <div class="form-group">
          <label>Pay Consumption:</label>
          <div class="form-fields">
            <input name="consumptionResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>Change Leadership:</label>
          <div class="form-fields">
            <input name="leadershipResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>Claim Hexes:</label>
          <div class="form-fields">
            <input name="claimResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>Terrain Improvements:</label>
          <div class="form-fields">
            <input name="terrainResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>Create Settlements:</label>
          <div class="form-fields">
            <input name="settlementResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>Construct Buildings:</label>
          <div class="form-fields">
            <input name="buildResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>Change Edicts:</label>
          <div class="form-fields">
            <input name="edictResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>Collect Taxes:</label>
          <div class="form-fields">
            <input name="economyResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>Continuous Events:</label>
          <div class="form-fields">
            <input name="oldEventResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>End BP:</label>
          <div class="form-fields">
            <input name="endBpResult" type="string">
          </div>
        </div>
        <div class="form-group">
          <label>End Unrest:</label>
          <div class="form-fields">
            <input name="endUnrestResult" type="string">
          </div>
        </div>
      </form>`,
        buttons: {
          save: {
            icon: '<i class="fa-solid fa-pen-to-square"></i>',
            label: game.i18n.localize("PF1RS.UpdateItem"),
            callback: async ([html]) => {
              const data = new FormDataExtended(html.querySelector("form")).object;
              console.log(data);
            },
          },
        },
      },
      {}
    );
  }

  async _onDeleteChange(event) {
    event.preventDefault();
    const a = event.currentTarget;

    const li = a.closest(".delete-change");
    const changeIdx = li.dataset.change;

    const changes = foundry.utils.deepClone(this.changesAE.changes ?? []);
    changes.splice(changeIdx, 1);

    this.changesAE.update({ changes });
  }
}
