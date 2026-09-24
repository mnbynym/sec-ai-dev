import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseDue, overdue, search, sortByDue } from "../src/report.js";
import { load } from "../src/store.js";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

test("parseDue converts relative days to milliseconds", () => {
  assert.equal(
    parseDue("+3d", new Date("2026-09-24T00:00:00.000Z")),
    "2026-09-27T00:00:00.000Z",
  );
});

test("parseDue rejects impossible dates", () => {
  assert.throws(() => parseDue("2026-02-30"), /存在しない日付/);
});

test("overdue excludes completed tasks", () => {
  const tasks = [
    { id: 1, title: "done", done: true, due: "2026-09-20" },
    { id: 2, title: "open", done: false, due: "2026-09-20" },
  ];
  assert.deepEqual(overdue(tasks, new Date("2026-09-24T12:00:00Z")), [tasks[1]]);
});

test("search ignores letter case", () => {
  assert.equal(search([{ title: "Review" }], "review").length, 1);
});

test("sortByDue does not mutate its input", () => {
  const tasks = [{ id: 1, due: "2026-09-30" }, { id: 2, due: "2026-09-20" }];
  const sorted = sortByDue(tasks);
  assert.deepEqual(sorted.map((task) => task.id), [2, 1]);
  assert.deepEqual(tasks.map((task) => task.id), [1, 2]);
});

test("load rejects malformed task records", () => {
  const directory = mkdtempSync(join(tmpdir(), "sec-ai-dev-test-"));
  const path = join(directory, "todo.json");
  const previous = process.env.TODO_FILE;
  process.env.TODO_FILE = path;
  try {
    writeFileSync(path, JSON.stringify([{ id: 1, title: "missing fields" }]));
    assert.throws(() => load(), /タスク形式が不正/);
  } finally {
    if (previous === undefined) delete process.env.TODO_FILE;
    else process.env.TODO_FILE = previous;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("due reports missing tasks without a TypeError", () => {
  const directory = mkdtempSync(join(tmpdir(), "sec-ai-dev-cli-"));
  const path = join(directory, "todo.json");
  const result = spawnSync(process.execPath, ["src/cli.js", "due", "999", "2026-10-01"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, TODO_FILE: path },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ID 999 のタスクが見つかりません/);
  rmSync(directory, { recursive: true, force: true });
});