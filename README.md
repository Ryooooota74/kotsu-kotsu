# Kotsu-Kotsu

個人用の1日タスク管理アプリ。iPhone / iPad / PC で同じデータを共有して使う。

公開URL: https://ryooooota74.github.io/kotsu-kotsu/

## 構成

単一HTMLで動く React 18 アプリ。ソースは `project/*.jsx` に分割されていて、
`scripts/build.sh` がそれを1つに連結・**ビルド時にJSXをコンパイル**して
`index.html`（デプロイされるファイル）を生成する。

```bash
bash scripts/build.sh   # project/*.jsx → index.html + sw.js
```

**コードを直したら必ずこれを実行してから push する。**

| パス | 役割 |
|---|---|
| `project/*.jsx` | ソース（唯一の編集対象） |
| `scripts/build.sh` | HTMLのhead/CSS/フッターのテンプレも含むビルドの本体 |
| `scripts/sw.template.js` | Service Worker のテンプレ（`sw.js` は生成物） |
| `index.html` | 生成物。GitHub Pages が配信する |
| `Task Manager.html` | ローカルでダブルクリック用の同一コピー（git管理外） |
| `backups/` | Supabaseの状態を手で退避したもの |

## データと同期

localStorage (`taskmgr_v4`) に常時保存しつつ、Supabase の `app_state` テーブルの
1行にJSONとして同期する。**last-write-wins**（後から書いた方が勝つ）。

- 起動時・アプリに戻ってきた時・オンライン復帰時に pull
- 変更の700ms後に push。失敗したらバックオフ付きで再送し続ける
- リモートの方が新しい時は、送信待ちのローカル変更を捨ててリモートを採用する

セットアップ手順とRLS/GRANTのハマりどころは `SYNC_SETUP.md` を参照。

**バックアップ**: メニュー →「Save backup」でJSONを書き出し、「Restore backup…」で戻せる。
同期がlast-write-winsなので、大きな変更の前に取っておくと安全。

## オフライン

Service Worker がシェルをキャッシュするので圏外でも起動する。HTMLはネットワーク優先
なので新しいビルドは普通に降ってくる。Supabaseへの通信はキャッシュしない。

## 自動アップデート

GitHub Pages はHTMLを10分キャッシュするため、端末が古いビルドを掴むことがある。
各ビルドに `window.__BUILD` のIDを埋め、読み込み1.5秒後に自分自身をno-storeで取り直して
IDが変わっていたら1回だけreloadする（セッション内で1回に制限）。
