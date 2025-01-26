import { allyId, eventId, moduleId, sheetId, teamId } from "./config.mjs";

export const defaultIcons = {
  actors: {
    [sheetId]: `modules/${moduleId}/assets/uprising.svg`,
  },
  items: {
    [allyId]: "icons/svg/angel.svg",
    [eventId]: "icons/svg/hazard.svg",
    [teamId]: "systems/pf1/icons/conditions/staggered.svg",
  },
};
