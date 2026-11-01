[English](../README.md) · [한국어](README.ko.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md)

# choboza-pack

Dos mods pequeños para Claude Code, hechos para principiantes. Son código local que se ejecuta en tu PC.

## Qué incluye

| Mod | Qué hace |
|---|---|
| **usage-line** | Una línea encima del campo de escritura: uso de 5 horas y semanal, modelo actual, effort y contexto. También muestra la carga de CPU, RAM y GPU, y la NPU si el sistema la informa. |
| **lab-panel** | Un panel lateral con una lista de archivos de colores. Los archivos que Claude lee o edita se iluminan un momento. La pestaña de repetición muestra los cambios del último turno. Las pestañas de notas te permiten guardar tus propias notas. Una pestaña de boceto te deja dibujar marcas y enviarlas a Claude (en Windows también sobre una imagen del portapapeles). |

## Instalación

Escribe esto en Claude Code:

```
/plugin marketplace add miguel-a-mir-ctrl/choboza-pack
/plugin install usage-line@choboza-pack
/plugin install lab-panel@choboza-pack
```

Después, reinicia Claude Code (o ejecuta `/reload-plugins`). Abre el panel con `/panel` o haz clic en `[Panel]` encima del campo de escritura (funciona incluso mientras Claude trabaja).

## Configuración

Cámbiala en la configuración del plugin (`/plugin`).

| Mod | Opción | Valores |
|---|---|---|
| ambos | `language` | `auto` (idioma de tu sistema), `ko`, `en`, `zh-Hans`, `zh-Hant`, `ja`, `es`, `fr`, `id`, `th` |
| usage-line | `gpu` | `auto` (la GPU más ocupada, predeterminado), `nvidia`, `amd`, `intel`, `off` |
| lab-panel | `icons` | `nerd` (iconos por tipo de archivo, por defecto), `plain` (letras simples) |
| lab-panel | `autoOpen` | `true` = abre el panel al iniciar una sesión (por defecto `false`) |
| lab-panel | `tabsDir` | Carpeta de tus pestañas de notas. Vacía = `~/.claude/choboza-pack/panel` |

## ¿Los iconos se ven como cuadros?

La lista de archivos usa iconos de [Nerd Font](https://www.nerdfonts.com/font-downloads). Si ves □ en lugar de iconos, prueba una de estas opciones:

- Instala una Nerd Font y elígela en la configuración de fuente de tu terminal
- Cambia `icons` a `plain`

## Notas

- Casi cero tokens: los mods se ejecutan en tu PC y no añaden nada a lo que Claude lee, salvo una nota corta (unos 20 tokens) cuando el contexto pasa de 100k, que sugiere `/compact` o una sesión nueva. Medido el 2026-11-01: los mismos tokens de entrada con y sin el pack (dentro del margen normal entre ejecuciones).
- Probado sobre todo en Windows. Linux y macOS también funcionan, pero con menos pruebas (en macOS no se muestra la NPU).
- Las traducciones que no son al coreano ni al inglés son hechas por máquina. Las correcciones son bienvenidas.

## Licencia

[MIT](../LICENSE)
