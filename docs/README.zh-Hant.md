[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack

兩個為初學者準備的 Claude Code 小模組。它們是在你電腦上執行的本機程式碼。

## 包含的內容

| 模組 | 功能 |
|---|---|
| **usage-line** | 輸入框上方的一行：5 小時和每週用量、目前模型、effort 和上下文。還會顯示 CPU、RAM 和 GPU 的使用率，系統支援時也顯示 NPU。 |
| **lab-panel** | 旁邊的面板，顯示彩色的檔案清單。Claude 讀取或修改過的檔案會亮一下。重播分頁顯示上一輪修改的內容。備註分頁可以放你自己的筆記。素描分頁可以畫標記並傳給 Claude（在 Windows 上還能畫在剪貼簿圖片上）。 |

## 安裝

在 Claude Code 中輸入：

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

然後重新啟動 Claude Code（或執行 `/reload-plugins`）。用 `/panel` 開啟面板，或點一下輸入框上方的 `[面板]`（Claude 忙碌時也能開啟）。

## 設定

在外掛設定（`/plugin`）中修改。

| 模組 | 設定 | 值 |
|---|---|---|
| 兩者 | `language` | `auto`（系統語言）、`ko`、`en`、`zh-Hans`、`zh-Hant`、`ja`、`es`、`fr`、`id`、`th` |
| usage-line | `gpu` | `auto`（最忙的 GPU，預設）、`nvidia`、`amd`、`intel`、`off` |
| lab-panel | `icons` | `nerd`（檔案類型圖示，預設）、`plain`（簡單字母） |
| lab-panel | `autoOpen` | `true` = 工作階段開始時開啟面板（預設 `false`） |
| lab-panel | `tabsDir` | 備註分頁的資料夾。留空 = `~/.claude/choboza-pack/panel` |

## 圖示顯示為方塊？

檔案清單使用 [Nerd Font](https://www.nerdfonts.com/font-downloads) 圖示。如果看到的是 □ 而不是圖示，可以試試以下兩種方法之一：

- 安裝 Nerd Font，並在終端機的字型設定中選擇它
- 把 `icons` 改為 `plain`

## 注意

- 幾乎不耗 token：這些模組在你的電腦上執行，不會為 Claude 讀取的內容增加任何東西。唯一的例外是上下文超過 100k 時會有一則簡短提示（約 20 token），建議使用 `/compact` 或開新工作階段。2026-11-01 實測：裝與不裝，輸入 token 相同（在正常誤差範圍內）。
- 主要在 Windows 上測試過。Linux 和 macOS 也能用，但測試較少（macOS 不顯示 NPU）。
- 韓文和英文以外的翻譯是機器翻譯的。歡迎幫忙修正。

## 授權

[MIT](../LICENSE)
