[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack

Deux petits mods pour Claude Code, conçus pour les débutants. Ce sont des codes locaux qui tournent sur votre PC.

## Contenu

| Mod | Ce qu'il fait |
|---|---|
| **usage-line** | Une ligne au-dessus de la zone de saisie : utilisation sur 5 heures et sur la semaine, modèle actuel, effort et contexte. Elle affiche aussi la charge CPU, RAM et GPU, et le NPU si le système le fournit. |
| **lab-panel** | Un panneau latéral avec une liste de fichiers colorée. Les fichiers que Claude lit ou modifie s'allument un instant. Un onglet de relecture montre les modifications du dernier tour. Des onglets de notes vous permettent de garder vos propres notes. Un onglet croquis permet de dessiner des repères et de les envoyer à Claude (sous Windows, aussi par-dessus une image du presse-papiers). |

## Installation

Tapez ceci dans Claude Code :

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

Ensuite, redémarrez Claude Code (ou lancez `/reload-plugins`). Ouvrez le panneau avec `/panel` ou cliquez sur `[Panneau]` au-dessus de la zone de saisie (cela marche même pendant que Claude travaille).

## Réglages

Modifiez-les dans les réglages du plugin (`/plugin`).

| Mod | Réglage | Valeurs |
|---|---|---|
| les deux | `language` | `auto` (langue de votre système), `ko`, `en`, `zh-Hans`, `zh-Hant`, `ja`, `es`, `fr`, `id`, `th` |
| usage-line | `gpu` | `auto` (le GPU le plus occupé, par défaut), `nvidia`, `amd`, `intel`, `off` |
| lab-panel | `icons` | `nerd` (icônes par type de fichier, par défaut), `plain` (lettres simples) |
| lab-panel | `autoOpen` | `true` = ouvre le panneau au démarrage d'une session (par défaut `false`) |
| lab-panel | `tabsDir` | Dossier de vos onglets de notes. Vide = `~/.claude/choboza-pack/panel` |

## Les icônes s'affichent en carrés ?

La liste de fichiers utilise les icônes [Nerd Font](https://www.nerdfonts.com/font-downloads). Si vous voyez □ à la place des icônes, faites l'une de ces deux choses :

- installez une Nerd Font et choisissez-la dans les réglages de police de votre terminal
- remplacez `icons` par `plain`

## Remarques

- Presque zéro token : les mods tournent sur votre PC et n'ajoutent rien à ce que Claude lit, sauf une courte note (environ 20 tokens) quand le contexte dépasse 100k, qui suggère `/compact` ou une nouvelle session. Mesuré le 2026-11-01 : mêmes tokens d'entrée avec et sans le pack (dans la marge normale entre deux essais).
- Testé surtout sous Windows. Linux et macOS fonctionnent aussi, mais sont moins testés (sur macOS, pas de NPU affiché).
- Les traductions autres que le coréen et l'anglais sont faites par machine. Les corrections sont les bienvenues.

## Licence

[MIT](../LICENSE)
