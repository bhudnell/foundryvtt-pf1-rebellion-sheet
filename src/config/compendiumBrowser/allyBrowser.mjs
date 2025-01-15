import { allyId } from "../config.mjs";

const commonFilters = pf1.applications.compendiumBrowser.filters.common;

class AllyFilter extends pf1.applications.compendiumBrowser.filters.BaseFilter {
  static label = "PF1RS.AllyStuff";
  static type = allyId;
}

export class AllyBrowser extends pf1.applications.compendiumBrowser.CompendiumBrowser {
  static documentName = "Item";
  static typeName = "PF1RS.Allies";
  static filterClasses = [commonFilters.PackFilter, commonFilters.TagFilter, AllyFilter];
}
