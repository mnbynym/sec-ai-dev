// タスクの永続化層。JSON ファイル 1 枚に読み書きするだけの薄いラッパー。
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const DEFAULT_PATH = join(homedir(), ".sec-ai-dev-todo.json");

/** 保存先のパス。TODO_FILE 環境変数で差し替えられる（テストやデモで便利）。 */
export function storePath() {
  return process.env.TODO_FILE || DEFAULT_PATH;
}

/**
 * タスク配列を読み込む。ファイルが無ければ空配列を返す。
 * 壊れた JSON は黙って捨てずにエラーにする（データ消失を防ぐため）。
 */
export function load() {
  const path = storePath();
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  if (raw.trim() === "") return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`保存ファイルが壊れています: ${path}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`保存ファイルの形式が不正です（配列ではありません）: ${path}`);
  }
  parsed.forEach((task, index) => validateTask(task, `${path} の ${index + 1} 件目`));
  return parsed;
}

/** タスク配列を保存する。親ディレクトリが無ければ作る。 */
export function save(tasks) {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  tasks.forEach((task, index) => validateTask(task, `${index + 1} 件目`));
  const content = JSON.stringify(tasks, null, 2) + "\n";
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporaryPath, content, "utf8");
  renameSync(temporaryPath, path);
}

function validateTask(task, label) {
  if (
    task === null ||
    typeof task !== "object" ||
    !Number.isSafeInteger(task.id) ||
    task.id < 1 ||
    typeof task.title !== "string" ||
    typeof task.done !== "boolean" ||
    typeof task.createdAt !== "string" ||
    (task.due !== undefined && typeof task.due !== "string")
  ) {
    throw new Error(`保存ファイルのタスク形式が不正です（${label}）`);
  }
}
