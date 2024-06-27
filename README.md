# foundryvtt-pf1-rebellion-sheet

Provides support for running a rebellion within the Pathfinder 1 game system. Includes the Rebellion Sheet actor type and Event, Team, and Ally item types.

---

# Actors

## Rebellion Sheet

The base actor for managing a rebellion. Events, teams, and allies are Items that can be added to the sheet

# Items

## Ally

Represents an ally to the rebellion. Can add changes to the organization stats, danger, or actions.

## Event

Represents an event that occurred in the events phase. All of the base events are preconfigured and available in the provided compendium.
Miscellaneous changes to the rebellion's stats (ie History of the Rebellion campaign trait) can be added by creating a new Event and changing the type to "Miscellaneous".

## Team

Represents a team the rebellion can recruit. All of the general teams are preconfigured and available in the provided compendium.
Unique teams can be added by creating a new Team and setting the type to "Unique".

# Roll Tables

## Event Roll Table

The Rebellion Event table has been turned into a roll table available in the provided compendium.
Event chance (then the event if it occurs) can also be rolled using the roll button found in the Rebellion Sheet Events tab.

# Journal Entries

## Actions

The list of available actions and their rules are available in the provided compendium.

---

# Attribution

- Big thanks to the developers of the [Pf1e system](https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1) for the sheet styling I tried to match
- Big thanks to [M.A.](https://gitlab.com/mkahvi) for answering many of my noobie questions as I got started and for the Companion Link and Item Hints modules, which I took inspiration from for various functionality
