#!/usr/bin/env node
// エントリポイント。引数を解釈して store / tasks を呼び出し、結果を表示する。
import { load, save, storePath } from "./store.js";
import * as tasks from "./tasks.js";
import * as report from "./report.js";

const USAGE = `sec-ai-dev todo — 依存ゼロの TODO 管理 CLI

使い方:
  node src/cli.js add <タスク名>    タスクを追加
  node src/cli.js list [all|open|done]
                                    一覧を表示（既定: all）
  node src/cli.js done <ID>         完了にする
  node src/cli.js undone <ID>       未完了に戻す
  node src/cli.js rm <ID>           削除する
  node src/cli.js due <ID> <期限>   期限を設定（2026-10-01 / +3d）
  node src/cli.js overdue           期限切れの未完了タスクを表示
  node src/cli.js find <キーワード> タイトルを検索
  node src/cli.js help              このヘルプ

保存先: TODO_FILE 環境変数、または ホーム直下の .sec-ai-dev-todo.json
        （現在の保存先は where コマンドで確認できます）`;

function render(list) {
  if (list.length === 0) {
    console.log("(タスクはありません)");
    return;
  }
  const width = String(Math.max(...list.map((t) => t.id))).length;
  for (const t of report.sortByDue(list)) {
    const id = String(t.id).padStart(width, " ");
    const due = t.due ? `  (期限: ${report.formatDue(t.due)})` : "";
    console.log(`${t.done ? "[x]" : "[ ]"} ${id}  ${t.title}${due}`);
  }
  // 絞り込み後のリストに対する集計なので「表示」と明示する。
  const { total, open, done } = tasks.summarize(list);
  console.log(`\n表示 ${total} 件 / 未完了 ${open} 件 / 完了 ${done} 件`);
}

function main(argv) {
  const [command, ...rest] = argv;

  switch (command) {
    case "add": {
      const title = rest.join(" ");
      const { tasks: next, task } = tasks.add(load(), title);
      save(next);
      console.log(`追加しました: #${task.id} ${task.title}`);
      return 0;
    }

    case "list":
    case undefined: {
      render(tasks.filter(load(), rest[0] ?? "all"));
      return 0;
    }

    case "done":
    case "undone": {
      if (rest.length === 0) throw new Error("ID を指定してください");
      const { tasks: next, task } = tasks.toggle(load(), rest[0], command === "done");
      save(next);
      console.log(`${task.done ? "完了" : "未完了に戻しました"}: #${task.id} ${task.title}`);
      return 0;
    }

    case "rm": {
      if (rest.length === 0) throw new Error("ID を指定してください");
      const { tasks: next, task } = tasks.remove(load(), rest[0]);
      save(next);
      console.log(`削除しました: #${task.id} ${task.title}`);
      return 0;
    }

    case "due": {
      const all = load();
      const id = Number(rest[0]);
      const task = all.find((t) => t.id === id);
      task.due = report.parseDue(rest[1]);
      save(all);
      console.log(`期限を設定しました: #${task.id} ${report.formatDue(task.due)}`);
      return 0;
    }

    case "overdue": {
      render(report.overdue(load()));
      return 0;
    }

    case "find": {
      render(report.search(load(), rest.join(" ")));
      return 0;
    }

    case "where": {
      console.log(storePath());
      return 0;
    }

    case "help":
    case "--help":
    case "-h": {
      console.log(USAGE);
      return 0;
    }

    default: {
      console.error(`不明なコマンド: ${command}\n`);
      console.error(USAGE);
      return 1;
    }
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  console.error(`エラー: ${err.message}`);
  process.exitCode = 1;
}
