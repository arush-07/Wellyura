#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const sourceRoot = path.resolve(process.argv[2] ?? "backend/legacy/source");
const outputRoot = path.resolve(process.argv[3] ?? "backend/legacy/extracted");
fs.mkdirSync(outputRoot, { recursive: true });

const seedFiles = fs.readdirSync(sourceRoot).filter((name) => name.endsWith("_universities_seed.js")).sort();
if (!seedFiles.length) throw new Error(`No university seed files found in ${sourceRoot}`);

const institutions = [];
const programmes = [];
let sequence = 0;

for (const file of seedFiles) {
  const makeCollection = (kind) => ({
    deleteMany() { return { deletedCount: 0 }; },
    createIndex() { return {}; },
    insertOne(document) {
      const id = `legacy_${++sequence}`;
      if (kind === "institutions") institutions.push({ ...structuredClone(document), _legacy_id: id, _source_file: file });
      if (kind === "programmes") programmes.push({ ...structuredClone(document), _legacy_id: id, _source_file: file });
      return { insertedId: id };
    },
    insertMany(documents) {
      const insertedIds = {};
      documents.forEach((document, index) => {
        const id = `legacy_${++sequence}`;
        insertedIds[index] = id;
        if (kind === "programmes") programmes.push({ ...structuredClone(document), _legacy_id: id, _source_file: file });
      });
      return { insertedIds };
    },
  });

  const database = {
    institutions: makeCollection("institutions"),
    programs: makeCollection("programmes"),
    scholarships: makeCollection("scholarships"),
    contacts: makeCollection("contacts"),
    createCollection() { return {}; },
  };
  const sandbox = {
    connect: () => database,
    print: () => undefined,
    console: { log() {}, warn() {}, error() {} },
    structuredClone,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(sourceRoot, file), "utf8"), sandbox, { filename: file, timeout: 15_000 });
}

fs.writeFileSync(path.join(outputRoot, "institutions.json"), JSON.stringify(institutions, null, 2));
fs.writeFileSync(path.join(outputRoot, "programmes.json"), JSON.stringify(programmes, null, 2));
console.log(`Extracted ${institutions.length} institutions and ${programmes.length} programmes from ${seedFiles.length} files.`);
