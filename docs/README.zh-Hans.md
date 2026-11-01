[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack

两个为初学者准备的 Claude Code 小模组。它们是在你电脑上运行的本地代码。

## 包含的内容

| 模组 | 作用 |
|---|---|
| **usage-line** | 输入框上方的一行：5 小时和每周用量、当前模型、effort 和上下文。还会显示 CPU、RAM 和 GPU 的占用率，系统支持时也显示 NPU。 |
| **lab-panel** | 旁边的面板，显示彩色的文件列表。Claude 读取或修改过的文件会亮一下。回放标签显示上一轮修改的内容。备注标签可以放你自己的笔记。素描标签可以画标记并发送给 Claude（在 Windows 上还能画在剪贴板图片上）。 |

## 安装

在 Claude Code 中输入：

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

然后重新启动 Claude Code（或运行 `/reload-plugins`）。用 `/panel` 打开面板，或点击输入框上方的 `[面板]`（Claude 忙碌时也能打开）。

## 设置

在插件设置（`/plugin`）中修改。

| 模组 | 设置 | 值 |
|---|---|---|
| 两者 | `language` | `auto`（系统语言）、`ko`、`en`、`zh-Hans`、`zh-Hant`、`ja`、`es`、`fr`、`id`、`th` |
| usage-line | `gpu` | `auto`（最忙的 GPU，默认）、`nvidia`、`amd`、`intel`、`off` |
| lab-panel | `icons` | `nerd`（文件类型图标，默认）、`plain`（简单字母） |
| lab-panel | `autoOpen` | `true` = 会话开始时打开面板（默认 `false`） |
| lab-panel | `tabsDir` | 备注标签的文件夹。留空 = `~/.claude/choboza-pack/panel` |

## 图标显示为方块？

文件列表使用 [Nerd Font](https://www.nerdfonts.com/font-downloads) 图标。如果看到的是 □ 而不是图标，可以试试以下两种办法之一：

- 安装 Nerd Font，并在终端的字体设置中选择它
- 把 `icons` 改为 `plain`

## 注意

- 几乎不耗 token：这些模组在你的电脑上运行，不会给 Claude 读取的内容增加任何东西。唯一的例外是上下文超过 100k 时会有一条简短提示（约 20 token），建议使用 `/compact` 或开新会话。2026-11-01 实测：装与不装，输入 token 相同（在正常误差范围内）。
- 主要在 Windows 上测试过。Linux 和 macOS 也能用，但测试较少（macOS 不显示 NPU）。
- 韩语和英语以外的翻译是机器翻译的。欢迎帮忙修正。

## 许可证

[MIT](../LICENSE)
