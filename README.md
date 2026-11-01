[English](README.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh-Hans.md) · [繁體中文](docs/README.zh-Hant.md) · [日本語](docs/README.ja.md) · [Español](docs/README.es.md) · [Français](docs/README.fr.md) · [Bahasa Indonesia](docs/README.id.md) · [ไทย](docs/README.th.md)

# choboza-pack

Two small mods for Claude Code, made for beginners. They run as local code on your PC.

## What's inside

| Mod | What it does |
|---|---|
| **usage-line** | A line above the prompt: 5-hour and weekly usage, the current model, effort and context. On Windows it also shows CPU, RAM, GPU and NPU load. |
| **lab-panel** | A side panel with a colorful file tree. Files Claude reads or edits light up for a moment. A replay tab shows the last turn's edits. Note tabs let you keep your own notes. On Windows there is also a sketch tab for drawing on an image. |

## Install

Type these in Claude Code:

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

Then restart Claude Code (or run `/reload-plugins`). Open the panel with `/panel`.

## Options

Change these in the plugin's settings (`/plugin`).

| Mod | Option | Values |
|---|---|---|
| both | `language` | `auto` (your system language), `ko`, `en`, `zh-Hans`, `zh-Hant`, `ja`, `es`, `fr`, `id`, `th` |
| lab-panel | `icons` | `nerd` (file-type icons, default), `plain` (simple letters) |
| lab-panel | `autoOpen` | `true` = open the panel when a session starts (default `false`) |
| lab-panel | `tabsDir` | Folder for your note tabs. Empty = `~/.claude/choboza-pack/panel` |

## Icons show as boxes?

The file tree uses [Nerd Font](https://www.nerdfonts.com/font-downloads) icons. If you see □ instead of icons, either:

- install a Nerd Font and pick it in your terminal's font settings, or
- set `icons` to `plain`.

## Notes

- The sketch tab and the CPU/GPU meter work on Windows only. Everything else works everywhere.
- Translations other than Korean and English are machine-made. Fixes are welcome.

## License

[MIT](LICENSE)
