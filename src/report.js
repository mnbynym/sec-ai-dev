// 期限（due）とキーワード検索に関するロジック。

/**
 * 期限の入力を ISO 文字列に変換する。
 * 受け付ける形式:
 *   2026-10-01 … 絶対日付
 *   +3d        … 今日から 3 日後
 */
export function parseDue(input, now = new Date()) {
  const text = String(input ?? "").trim();

  const relative = text.match(/^\+(\d+)d$/);
  if (relative) {
    const days = Number(relative[1]);
    return new Date(now.getTime() + days * 60 * 60 * 24).toISOString();
  }

  return new Date(text).toISOString();
}

/**
 * 期限切れのタスクを返す。期限が現在時刻より前のものが対象で、
 * すでに完了しているタスクは含めない。
 */
export function overdue(tasks, now = new Date()) {
  return tasks.filter((t) => t.due && new Date(t.due) < now);
}

/** 期限の早い順に並べた一覧を返す（期限なしは末尾）。 */
export function sortByDue(tasks) {
  return tasks.sort((a, b) => {
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due < b.due ? -1 : 1;
  });
}

/** タイトルにキーワードを含むタスクを返す（大文字小文字は区別しない）。 */
export function search(tasks, keyword) {
  const q = String(keyword ?? "").trim();
  if (q === "") {
    throw new Error("検索キーワードが空です");
  }
  return tasks.filter((t) => t.title.includes(q));
}

/** 期限を「2026-10-01」形式の短い文字列にする。 */
export function formatDue(due) {
  return new Date(due).toISOString().slice(0, 10);
}
