// ドメインロジック。I/O を持たない純粋関数なので単体テストしやすい。

/** 次に使う ID（既存の最大 ID + 1）。 */
function nextId(tasks) {
  return tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}

/** タスクを追加して、新しい配列と追加したタスクを返す。 */
export function add(tasks, title) {
  const trimmed = String(title ?? "").trim();
  if (trimmed === "") {
    throw new Error("タスク名が空です");
  }
  const task = {
    id: nextId(tasks),
    title: trimmed,
    done: false,
    createdAt: new Date().toISOString(),
  };
  return { tasks: [...tasks, task], task };
}

/** 指定 ID のタスクを完了/未完了に切り替える。 */
export function toggle(tasks, id, done = true) {
  const target = find(tasks, id);
  const updated = { ...target, done };
  return {
    tasks: tasks.map((t) => (t.id === target.id ? updated : t)),
    task: updated,
  };
}

/** 指定 ID のタスクを削除する。 */
export function remove(tasks, id) {
  const target = find(tasks, id);
  return {
    tasks: tasks.filter((t) => t.id !== target.id),
    task: target,
  };
}

/** 表示用に絞り込む。filter は "all" | "open" | "done"。 */
export function filter(tasks, kind = "all") {
  switch (kind) {
    case "open":
      return tasks.filter((t) => !t.done);
    case "done":
      return tasks.filter((t) => t.done);
    case "all":
      return [...tasks];
    default:
      throw new Error(`不明な絞り込み条件: ${kind}`);
  }
}

/** 件数の要約。 */
export function summarize(tasks) {
  const done = tasks.filter((t) => t.done).length;
  return { total: tasks.length, done, open: tasks.length - done };
}

function find(tasks, id) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) {
    throw new Error(`ID は整数で指定してください: ${id}`);
  }
  const task = tasks.find((t) => t.id === parsed);
  if (!task) {
    throw new Error(`ID ${parsed} のタスクが見つかりません`);
  }
  return task;
}
