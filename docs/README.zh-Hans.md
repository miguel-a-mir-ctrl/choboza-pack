[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack

两个为初学者准备的 Claude Code 小模组。它们是在你电脑上运行的本地代码。

## 包含的内容

| 模组 | 作用 |
|---|---|
| **usage-line** | 输入框上方的一行：5 小时和每周用量、当前模型、effort 和上下文。在 Windows 上还会显示 CPU、RAM、GPU 和 NPU 的占用率。 |
| **lab-panel** | 旁边的面板，显示彩色的文件列表。Claude 读取或修改过的文件会亮一下。回放标签显示上一轮修改的内容。备注标签可以放你自己的笔记。在 Windows 上还有一个可以在图片上画画的素描标签。 |

## 安装

在 Claude Code 中输入：

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

然后重新启动 Claude Code（或运行 `/reload-plugins`）。用 `/panel` 打开面板。

## 设置

在插件设置（`/plugin`）中修改。

| 模组 | 设置 | 值 |
|---|---|---|
| 两者 | `language` | `auto`（系统语言）、`ko`、`en`、`zh-Hans`、`zh-Hant`、`ja`、`es`、`fr`、`id`、`th` |
| lab-panel | `icons` | `nerd`（文件类型图标，默认）、`plain`（简单字母） |
| lab-panel | `autoOpen` | `true` = 会话开始时打开面板（默认 `false`） |
| lab-panel | `tabsDir` | 备注标签的文件夹。留空 = `~/.claude/choboza-pack/panel` |

## 图标显示为方块？

文件列表使用 [Nerd Font](https://www.nerdfonts.com/font-downloads) 图标。如果看到的是 □ 而不是图标，可以试试以下两种办法之一：

- 安装 Nerd Font，并在终端的字体设置中选择它
- 把 `icons` 改为 `plain`

## 注意

- 素描标签和 CPU/GPU 显示仅在 Windows 上可用。其他功能在所有系统上都能用。
- 韩语和英语以外的翻译是机器翻译的。欢迎帮忙修正。

## 许可证

[MIT](../LICENSE)
