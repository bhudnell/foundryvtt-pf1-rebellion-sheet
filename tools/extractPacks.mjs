import { promises as fs } from "fs";
import path from "path";

import { extractPack } from "@foundryvtt/foundryvtt-cli";

import { compiledPacksDir, sourcePacksDir } from "./config.mjs";

function sluggify(string) {
  return string
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .replace(/\s+|-{2,}/g, "-");
}

function sanitizePackEntry(entry, documentType = "") {
  delete entry._stats;

  if (documentType === "JournalEntryPage") {
    return entry;
  }

  delete entry.ownership;

  // Remove folders if null
  if (entry.folder === null) {
    delete entry.folder;
  }

  if (entry.pages) {
    entry.pages = entry.pages.map((page) => sanitizePackEntry(page));
  }

  return entry;
}

const packs = await fs.readdir(compiledPacksDir);
const promises = packs.map(async (pack) => {
  console.log("Unpacking " + pack);
  const dest = path.join(sourcePacksDir, pack);
  const destFiles = await fs.readdir(dest);
  try {
    const unlinkPromises = destFiles.map((file) => fs.unlink(path.join(dest, file)));
    await Promise.all(unlinkPromises);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("No files inside of " + pack);
    } else {
      console.log(error);
    }
  }
  const src = path.join(compiledPacksDir, pack);

  return extractPack(src, dest, {
    yaml: true,
    log: true,
    transformEntry: (entry) => sanitizePackEntry(entry),
    transformName: (entry) => `${sluggify(entry.name)}.${entry._id}.yaml`,
  });
});

await Promise.all(promises);
