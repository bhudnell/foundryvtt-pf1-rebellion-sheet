import { allyId, eventId, sheetId, teamId } from "./config.mjs";

export const defaultIcons = {
  // TODO
  actors: {
    [sheetId]: "icons/svg/city.svg",
  },
  items: {
    [allyId]: "icons/svg/house.svg",
    [eventId]: "icons/svg/clockwork.svg",
    [teamId]: "icons/svg/windmill.svg",
  },
};
