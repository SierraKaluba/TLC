/* eslint @typescript-eslint/no-require-imports: "off" */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const databaseSourcePath = path.resolve(__dirname, "../lib/database.ts");
const source = fs.readFileSync(databaseSourcePath, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
});

const databaseModule = new Module(databaseSourcePath, module);
databaseModule.filename = databaseSourcePath;
databaseModule.paths = Module._nodeModulePaths(path.dirname(databaseSourcePath));
databaseModule._compile(outputText, databaseSourcePath);

const { closeDatabase, readCollection } = databaseModule.exports;

try {
  const profiles = readCollection("profiles");
  assert.ok(profiles.some((profile) => profile.id === "user-alice"), "SQLite should include the seeded user-alice profile");
  console.log("SQLite data layer test passed");
} finally {
  closeDatabase();
}
