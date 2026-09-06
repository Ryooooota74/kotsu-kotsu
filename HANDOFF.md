# 引き継ぎメモ（HANDOFF）

このファイルは、クラウド(web)セッションからローカルのClaude Codeに作業を移すための状態メモです。
ローカルでセッションを開いたら、まずこのファイルを読んでください。

## このプロジェクトは何か
「Kotsu-Kotsu」= 個人用の1日タスク管理アプリ。複数端末（iPhone / iPad / PC）で
同じデータを共有して使うのが目的。

- 単一HTMLで動く（React 18 production をCDNから読み込み。JSXはビルド時にコンパイル済み）
- 設計ソースは `project/*.jsx`。これを `scripts/build.sh` で1つに連結・コンパイルして
  `index.html`（＋ローカル用の `Task Manager.html`、＋`sw.js`）を生成する
- データはブラウザのlocalStorageに保存しつつ、Supabaseに1行のJSONとして
  自動同期（起動時・復帰時・オンライン復帰時にpull / 変更時にdebounce push＋失敗時は再送 / last-write-wins）

## ビルド方法
```bash
bash scripts/build.sh   # project/*.jsx → index.html と "Task Manager.html" を再生成
```
コードを直したら必ずこれを実行してから push する。

## ホスティング
- GitHub Pages（リポジトリ: github.com/Ryooooota74/kotsu-kotsu、現在 public）
- 公開URL: https://ryooooota74.github.io/kotsu-kotsu/
- push すれば Pages が自動で再ビルドされる

## Supabase 同期の設定場所
キーは2か所に同じ値が入っている（`scripts/build.sh` のテンプレートが正、
`index.html`/`Task Manager.html` は生成物）:
```js
window.KOTSU_SYNC = {
  url: "https://qgigeglnultxvtxjhvhw.supabase.co",
  anonKey: "sb_publishable_QpOCMkO9ARPfWbeu2_lNvQ_2rH2BwtN", // 新形式のpublishable key
  table: "app_state",
  rowId: "main"
};
```
Supabase側: `app_state(id text pk, data jsonb, updated_at timestamptz)` テーブルと、
anonロール向けの select/insert/update RLSポリシーは作成済み。

## 完了済み
- 設計の単一ファイル再現（phone/iPad/laptop、エラー0で確認済み）
- Supabase自動同期レイヤーの実装
- 画面幅で自動レイアウト切替＆全画面表示（端末切替バーと偽デバイス枠は撤去）
  - 判定: <768px=phone / <1200px=ipad / >=1200px=laptop（`project/app.jsx` の useViewport）

## 解決済み（2026-06-17）
1. **同期バッジが "Offline"（赤）になる問題 → 解決。**
   - 原因: `app_state` テーブルに対する **anonロールへのテーブルGRANTが未付与**。
     RLSポリシーは作成済みだが、Postgres/Supabaseは「テーブルGRANT」と「RLSポリシー」の
     両方を通過しないとアクセスできない。GRANTが無いためRLS判定前に401(`42501`)で弾かれていた。
   - 修正: Supabase SQL Editor で実行（ユーザー実施済み）:
     ```sql
     grant select, insert, update on table public.app_state to anon;
     ```
   - 確認: ローカルから `curl` で SELECT=200 / UPSERT=201 / 読み戻し一致 を確認済み。
   - キー・URL・ネットワーク・コード(`store.jsx`)は元々正常。コード修正・rebuild・push は不要だった。
   - `SYNC_SETUP.md` のセットアップSQL/トラブルシュートにこのGRANTを追記済み（再発防止）。
   - 診断用 `synctest.html` は削除済み。Supabaseに残る `synctest` 行は無害（anonにdelete権限は
     未付与のまま＝意図的。消すなら Table Editor から手動で）。

## 次の一手
- 実機（iPhone/iPad/PC）で公開URLを開き、バッジが緑 "Synced" になり端末間でデータ共有できるか最終確認。

## Git 状態
- remote `origin` = https://github.com/Ryooooota74/kotsu-kotsu.git 設定済み
- ローカル main は origin/main より進んでおり、`git push` するだけで反映できる
  （履歴は origin の上に整理済みなので force 不要）
