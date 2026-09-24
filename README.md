# sec-ai-dev

AI 開発デモ用のサンプルリポジトリ。

## TODO CLI

依存ゼロ（Node.js 標準モジュールのみ）の TODO 管理コンソールアプリ。

```
src/store.js   JSON ファイルへの永続化
src/tasks.js   ドメインロジック（純粋関数）
src/report.js  期限・検索のロジック
src/cli.js     エントリポイント / 引数解釈 / 表示
package.json   メタ情報・スクリプト
```

### 使い方

```powershell
node src/cli.js add "設計レビューを依頼する"
node src/cli.js list            # all（既定） / open / done
node src/cli.js done 1
node src/cli.js undone 1
node src/cli.js rm 1
node src/cli.js due 1 2026-10-01 # 期限を設定（+3d のような相対指定も可）
node src/cli.js overdue          # 期限切れの未完了タスクを表示
node src/cli.js find レビュー     # タイトルを部分一致で検索（大文字小文字は区別しない）
node src/cli.js where            # 保存先のパスを表示
node src/cli.js help
```

保存先は `TODO_FILE` 環境変数、未設定なら `$HOME\.sec-ai-dev-todo.json`。

```powershell
# このセッションだけ保存先を切り替える
$env:TODO_FILE = ".\todo.json"
node src/cli.js list

# 元に戻す
Remove-Item Env:\TODO_FILE
```
