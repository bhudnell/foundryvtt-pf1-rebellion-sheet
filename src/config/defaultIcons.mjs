import { allyId, eventId, rebellionId, teamId } from "./config.mjs";

export const defaultIcons = {
  // TODO
  actors: {
    [rebellionId]: "icons/svg/city.svg",
  },
  items: {
    [allyId]: "icons/svg/house.svg",
    [eventId]: "icons/svg/clockwork.svg",
    [teamId]: "icons/svg/windmill.svg",
  },
};
