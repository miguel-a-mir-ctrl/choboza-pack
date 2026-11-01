// Pure logic for the file-activity marks in the tree and the replay tab (no engine calls; tested in activity.test.ts).
import type { PanelStep, PanelTouch } from '../types'

// The session's project root ('/' separators), set at session start; tests set it too.
export let ROOT = ''
export function setRoot(r: string) {
  ROOT = r.replace(/\\/g, '/').replace(/\/+$/, '')
}
export const HOT_MS = 4_000 // strong color right after a touch
export const FADE_MS = 30_000 // after this the mark disappears
const MAX_TOUCHES = 60
const MAX_TEXT = 20_000 // cap stored before/after text per step

// Absolute or relative path → path relative to ROOT with '/' (null when outside the root).
export function toRel(p: string | undefined): string | null {
  if (!p || !ROOT) return null
  let s = p.replace(/\\/g, '/').replace(/\/+$/, '')
  if (/^\/[a-z]\//i.test(s)) s = `${s[1]}:${s.slice(2)}` // Git Bash /c/... form
  const root = ROOT.toLowerCase()
  const low = s.toLowerCase()
  if (low === root) return ''
  if (low.startsWith(root + '/')) return s.slice(ROOT.length + 1)
  return null
}

// Which file a tool call touched and how. Shell commands are skipped (paths inside them are guesses).
export function touchOf(tool: string, input: Record<string, unknown>): { path: string; kind: 'read' | 'edit' } | null {
  const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : undefined)
  if (tool === 'Read') return wrap(toRel(str('file_path')), 'read')
  if (tool === 'Grep' || tool === 'Glob') return wrap(toRel(str('path')), 'read')
  if (tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit') return wrap(toRel(str('file_path') ?? str('notebook_path')), 'edit')
  return null
}
const wrap = (path: string | null, kind: 'read' | 'edit') => (path === null ? null : { path, kind })

// Newest first, one entry per path; an edit is not downgraded to read for HOT_MS.
export function addTouch(list: PanelTouch[], t: PanelTouch): PanelTouch[] {
  const old = list.find(x => x.path === t.path)
  const kind = old && old.kind === 'edit' && t.kind === 'read' && t.at - old.at < HOT_MS ? 'edit' : t.kind
  return [{ ...t, kind }, ...list.filter(x => x.path !== t.path)].slice(0, MAX_TOUCHES)
}

// The mark for one tree row: its own touch, or for a collapsed folder the newest touch inside it.
export function heatOf(list: PanelTouch[], path: string, collapsedDir: boolean, now: number): { kind: 'read' | 'edit'; hot: boolean } | null {
  const hit = list.find(x => now - x.at < FADE_MS && (x.path === path || (collapsedDir && (path === '' || x.path.startsWith(path + '/')))))
  return hit ? { kind: hit.kind, hot: now - hit.at < HOT_MS } : null
}

export const anyFresh = (list: PanelTouch[], now: number) => list.some(x => now - x.at < FADE_MS)

// Nerd Font icon + color per file type (D2KodingLigature Nerd Font Mono; other fonts show a box). Colors: seti/VS Code family.
const ICONS: [RegExp, string, string][] = [
  [/\.py$/i, '\ue73c', '#4B8BBE'], [/\.md$/i, '\uf48a', '#6CB6FF'], [/\.json$/i, '\ue60b', '#E5C07B'], [/\.(js|mjs|cjs)$/i, '\ue74e', '#F1E05A'],
  [/\.ts$/i, '\ue628', '#3178C6'], [/\.tsx$/i, '\ue7ba', '#61DAFB'], [/\.html?$/i, '\ue736', '#E44D26'], [/\.css$/i, '\ue749', '#42A5F5'],
  [/\.ps1$/i, '\uebc7', '#5391FE'], [/\.(bat|cmd|sh)$/i, '\ue795', '#8DC149'], [/\.(csv|xlsx?)$/i, '\uf1c3', '#21A366'],
  [/\.(png|jpe?g|gif|webp|svg)$/i, '\uf1c5', '#A074C4'], [/\.pdf$/i, '\uf1c1', '#E5534B'], [/\.(zip|7z|gz)$/i, '\uf1c6', '#D19A66'],
  [/\.kt$/i, '\ue634', '#B07CFF'], [/^\.git/i, '\ue702', '#F05033'], [/\.(txt|log)$/i, '\uf15c', '#9DA5B4'],
]
const FILE_ICON = ['\uf15b', '#7F8790']
export const DIR_COLOR = '#E8B85C'
export const GUIDE_COLOR = '#4A4F57'
// plain = ASCII for terminals without a Nerd Font (1 cell each, like the Nerd Mono glyphs; color still shows the type).
let PLAIN = false
export function setIcons(mode: string) { PLAIN = mode === 'plain' }
export function iconOf(name: string, isDir: boolean, open: boolean): string {
  if (isDir) return PLAIN ? (open ? 'v' : '>') : open ? '\uf07c' : '\uf07b'
  if (PLAIN) return '-'
  return ICONS.find(([re]) => re.test(name))?.[1] ?? FILE_ICON[0]
}
export function iconColorOf(name: string, isDir: boolean): string {
  if (isDir) return DIR_COLOR
  return ICONS.find(([re]) => re.test(name))?.[2] ?? FILE_ICON[1]
}

// Terminal cells of a string (Hangul and other wide letters = 2).
export const cellsOf = (s: string) => [...s].reduce((n, c) => n + (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(c) ? 2 : 1), 0)
// Cut a name to `room` cells with an ellipsis.
export function fitCells(s: string, room: number): string {
  if (cellsOf(s) <= room) return s
  let out = ''
  for (const c of s) {
    if (cellsOf(out + c) > room - 1) break
    out += c
  }
  return out + '\u2026'
}

// One replay step from an edit call. `before` = file text read just before a Write.
export function stepOf(tool: string, input: Record<string, unknown>, before: string | null): PanelStep | null {
  const path = toRel(typeof input.file_path === 'string' ? input.file_path : undefined)
  if (path === null) return null
  const cut = (s: string) => (s.length > MAX_TEXT ? s.slice(0, MAX_TEXT) : s)
  if (tool === 'Edit') return { path, tool, before: cut(String(input.old_string ?? '')), after: cut(String(input.new_string ?? '')) }
  if (tool === 'Write') return { path, tool, before: cut(before ?? ''), after: cut(String(input.content ?? '')) }
  return null
}

// Short diff: drop the common head and tail lines, the rest is removed (-) / added (+).
export function diffOf(before: string, after: string, max = 12): { added: number; removed: number; lines: { sign: '+' | '-'; text: string }[] } {
  const a = before ? before.replace(/\r/g, '').split('\n') : []
  const b = after ? after.replace(/\r/g, '').split('\n') : []
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head++
  let tail = 0
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++
  const x = a.slice(head, a.length - tail)
  const y = b.slice(head, b.length - tail)
  const lines: { sign: '+' | '-'; text: string }[] = []
  // shortcut: LCS only up to 400x400 middle lines; bigger changes count as all removed + all added
  if (x.length * y.length > 0 && x.length <= 400 && y.length <= 400) {
    const L = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0))
    for (let i = x.length - 1; i >= 0; i--)
      for (let j = y.length - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
    let i = 0
    let j = 0
    while (i < x.length || j < y.length) {
      if (i < x.length && j < y.length && x[i] === y[j]) { i++; j++ }
      else if (i < x.length && (j >= y.length || L[i + 1][j] >= L[i][j + 1])) lines.push({ sign: '-', text: x[i++] })
      else lines.push({ sign: '+', text: y[j++] })
    }
  } else {
    lines.push(...x.map(text => ({ sign: '-' as const, text })), ...y.map(text => ({ sign: '+' as const, text })))
  }
  const added = lines.filter(l => l.sign === '+').length
  return { added, removed: lines.length - added, lines: lines.slice(0, max) }
}
