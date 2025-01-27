import { teamId } from "../config.mjs";

const commonFilters = pf1.applications.compendiumBrowser.filters.common;

class TeamFilter extends pf1.applications.compendiumBrowser.filters.BaseFilter {
  static label = "PF1RS.TeamStuff";
  static type = teamId;
}

export class TeamBrowser extends pf1.applications.compendiumBrowser.CompendiumBrowser {
  static documentName = "Item";
  static typeName = "PF1RS.Teams";
  static filterClasses = [commonFilters.PackFilter, commonFilters.TagFilter, TeamFilter];
}
