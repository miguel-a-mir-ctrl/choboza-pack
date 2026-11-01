[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack

初心者向けの Claude Code 用の小さなモッド 2 つです。お使いの PC 上で動くローカルのコードです。

## 含まれるもの

| モッド | 役割 |
|---|---|
| **usage-line** | 入力欄の上の 1 行。5 時間・週間の使用量、今のモデル、effort、コンテキストを表示します。CPU・RAM・GPU の使用率も表示され、システムが対応していれば NPU も表示されます。 |
| **lab-panel** | ファイル一覧がカラフルに表示される横のパネル。Claude が読んだり直したりしたファイルが一瞬光ります。リプレイタブでは直前のターンの変更内容を見られます。メモタブには自分のメモを残せます。スケッチタブで印を描いて Claude に送れます（Windows ではクリップボードの画像の上にも描けます）。 |

## インストール

Claude Code で次の行を入力してください:

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

そのあと Claude Code を再起動してください（または `/reload-plugins` を実行）。パネルは `/panel` で開くか、入力欄の上の `[パネル]` をクリックします（Claude の作業中でも開けます）。

## 設定

プラグインの設定（`/plugin`）で変更します。

| モッド | 設定 | 値 |
|---|---|---|
| 両方 | `language` | `auto`（システムの言語）、`ko`、`en`、`zh-Hans`、`zh-Hant`、`ja`、`es`、`fr`、`id`、`th` |
| usage-line | `gpu` | `auto`（一番忙しい GPU、既定）、`nvidia`、`amd`、`intel`、`off` |
| lab-panel | `icons` | `nerd`（ファイル種類のアイコン、既定）、`plain`（シンプルな文字） |
| lab-panel | `autoOpen` | `true` = セッション開始時にパネルを開く（既定は `false`） |
| lab-panel | `tabsDir` | メモタブのフォルダ。空欄なら `~/.claude/choboza-pack/panel` |

## アイコンが四角に見えますか？

ファイル一覧は [Nerd Font](https://www.nerdfonts.com/font-downloads) のアイコンを使います。アイコンの代わりに □ が見える場合は、次のどちらかを試してください:

- Nerd Font をインストールし、ターミナルのフォント設定で選ぶ
- `icons` を `plain` に変える

## 注意

- トークンはほぼゼロ：モッドはあなたの PC で動き、Claude が読む内容に何も足しません。例外は、文脈が 100k を超えたときに `/compact` か新しいセッションを勧める短いメモ（約 20 トークン）だけです。2026-11-01 計測：パックのありなしで入力トークンは同じでした（通常の誤差の範囲内）。
- 主に Windows でテストしています。Linux と macOS でも動きますが、テストは少なめです（macOS では NPU は表示されません）。
- 韓国語と英語以外の翻訳は機械翻訳です。修正は大歓迎です。

## ライセンス

[MIT](../LICENSE)
