[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack

Deux petits mods pour Claude Code, conçus pour les débutants. Ce sont des codes locaux qui tournent sur votre PC.

## Contenu

| Mod | Ce qu'il fait |
|---|---|
| **usage-line** | Une ligne au-dessus de la zone de saisie : utilisation sur 5 heures et sur la semaine, modèle actuel, effort et contexte. Sous Windows, elle affiche aussi la charge CPU, RAM, GPU et NPU. |
| **lab-panel** | Un panneau latéral avec une liste de fichiers colorée. Les fichiers que Claude lit ou modifie s'allument un instant. Un onglet de relecture montre les modifications du dernier tour. Des onglets de notes vous permettent de garder vos propres notes. Sous Windows, il y a aussi un onglet croquis pour dessiner sur une image. |

## Installation

Tapez ceci dans Claude Code :

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

Ensuite, redémarrez Claude Code (ou lancez `/reload-plugins`). Ouvrez le panneau avec `/panel`.

## Réglages

Modifiez-les dans les réglages du plugin (`/plugin`).

| Mod | Réglage | Valeurs |
|---|---|---|
| les deux | `language` | `auto` (langue de votre système), `ko`, `en`, `zh-Hans`, `zh-Hant`, `ja`, `es`, `fr`, `id`, `th` |
| lab-panel | `icons` | `nerd` (icônes par type de fichier, par défaut), `plain` (lettres simples) |
| lab-panel | `autoOpen` | `true` = ouvre le panneau au démarrage d'une session (par défaut `false`) |
| lab-panel | `tabsDir` | Dossier de vos onglets de notes. Vide = `~/.claude/choboza-pack/panel` |

## Les icônes s'affichent en carrés ?

La liste de fichiers utilise les icônes [Nerd Font](https://www.nerdfonts.com/font-downloads). Si vous voyez □ à la place des icônes, faites l'une de ces deux choses :

- installez une Nerd Font et choisissez-la dans les réglages de police de votre terminal
- remplacez `icons` par `plain`

## Remarques

- L'onglet croquis et l'indicateur CPU/GPU ne fonctionnent que sous Windows. Le reste fonctionne partout.
- Les traductions autres que le coréen et l'anglais sont faites par machine. Les corrections sont les bienvenues.

## Licence

[MIT](../LICENSE)
