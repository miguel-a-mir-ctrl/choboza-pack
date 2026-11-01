import { setLang, t as tr } from './i18n'
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { PanelCanvas, PanelDots, PanelEdit, PanelMark, PanelStep, PanelTab, PanelTouch } from '../types'
import { addTouch, anyFresh, cellsOf, setRoot, diffOf, fitCells, GUIDE_COLOR, heatOf, iconColorOf, iconOf, setIcons, stepOf, touchOf } from './activity'

const PANE = 'lab-panel'
// Set at session start from the engine (project root, home, the mod's own folder).
let TITLE = ''
let ROOT = ''
// 내 탭 목록과 내용. Claude 가 합의한 내용을 <id>.md 에 쓰면 패널에 나온다.
let TABS_DIR = '' // my tabs live in the user's home, shared by every project
let TABS_FILE = ''
let SKETCH_DIR = ''
let IS_WINDOWS = false
const SKIP = new Set(['.git', 'venv', '.venv', 'node_modules', '__pycache__', 'browser-profile', '.claude'])

const tabAtom = atom({ plugin: 'lab-panel', key: 'tab' } as const, 'tree')
const expandedAtom = atom({ plugin: 'lab-panel', key: 'expanded' } as const, [] as string[])
const addingAtom = atom({ plugin: 'lab-panel', key: 'adding' } as const, false)
const tickAtom = atom({ plugin: 'lab-panel', key: 'tick' } as const, 0)
const canvasAtom = atom({ plugin: 'lab-panel', key: 'canvas' } as const, null as PanelCanvas | null)
const strokesAtom = atom({ plugin: 'lab-panel', key: 'strokes' } as const, [] as number[][][])
const clearAtom = atom({ plugin: 'lab-panel', key: 'clear' } as const, 0)
const offsetsAtom = atom({ plugin: 'lab-panel', key: 'offsets' } as const, {} as Record<string, number>) // 탭마다 스크롤 위치
const openAtom = atom({ plugin: 'lab-panel', key: 'open' } as const, '') // file opened from the tree (relative to the project root)
const viewAtom = atom({ plugin: 'lab-panel', key: 'view' } as const, 'memo' as 'memo' | 'file') // 내 탭에서 보는 것
const toolAtom = atom({ plugin: 'lab-panel', key: 'tool' } as const, 'strike')
const editAtom = atom({ plugin: 'lab-panel', key: 'edit' } as const, null as PanelEdit | null)
const draftAtom = atom({ plugin: 'lab-panel', key: 'draft' } as const, '') // 입력칸에 쓰는 중인 글 ([보내기] 버튼이 쓴다)
const delAtom = atom({ plugin: 'lab-panel', key: 'del' } as const, '') // 지우기를 한 번 누른 탭 id
const wideAtom = atom({ plugin: 'lab-panel', key: 'wide' } as const, false) // false = narrow dock (default; user finds the panel too big)
const NARROW_COLS = 34
const touchesAtom = atom({ plugin: 'lab-panel', key: 'touches' } as const, [] as PanelTouch[])
const stepsAtom = atom({ plugin: 'lab-panel', key: 'steps' } as const, [] as PanelStep[]) // last finished turn's edits
const pendingAtom = atom({ plugin: 'lab-panel', key: 'pending' } as const, [] as PanelStep[]) // this turn's edits so far
const rstepAtom = atom({ plugin: 'lab-panel', key: 'rstep' } as const, 0)
const dotsAtom = atom({ plugin: 'lab-panel', key: 'dots' } as const, { tree: false, replay: false } as PanelDots)
// read = purple, edit = orange (bright right after the touch, softer while fading)
const HEAT = { read: ['#C3A6FF', '#8F7BC0'], edit: ['#FF9640', '#C08050'] } as const
// Pane width is a request: a width the user dragged wins. Wide = engine default share.
const openPane = async ($: EngineInterface) => $.ui.open({ id: PANE, title: TITLE, ...((await read($, wideAtom)) ? {} : { columns: NARROW_COLS }) })
const TEXT_EXT = /\.(md|txt|py|json|js|ts|tsx|ps1|bat|html|css|ya?ml|toml|ini|log)$/i // 보기용 (csv 는 장부라 제외)

// 터미널 칸 수: 한글 등은 2칸
const cols = (s: string) => [...s].reduce((n, c) => n + ((c.codePointAt(0) ?? 0) >= 0x1100 ? 2 : 1), 0)

// 한 줄을 칸 수에 맞게 여러 줄로 자른다
function wrap(line: string, width: number): string[] {
  const out: string[] = []
  let cur = ''
  for (const c of line) {
    if (cols(cur + c) > width) { out.push(cur); cur = '' }
    cur += c
  }
  out.push(cur)
  return out
}

// 글 보기 표시: 파일마다 panel/marks/<경로>.json. 줄·글자 번호는 탭을 공백 2칸으로 편 글 기준.
const marksFile = (open: string) => `${TABS_DIR}/marks/${open.replace(/[\\/:]/g, '__')}.json`

async function loadMarks($: EngineInterface, open: string): Promise<PanelMark[]> {
  try {
    const list = JSON.parse(await $.fs.read(marksFile(open)))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

const saveMarks = ($: EngineInterface, open: string, marks: PanelMark[]) =>
  $.fs.write(marksFile(open), JSON.stringify(marks, null, 2) + '\n')

async function newMark($: EngineInterface, open: string, s: { line: number; c0: number; c1: number; kind: string }, text?: string): Promise<PanelMark> {
  const src = (await $.fs.read(`${ROOT}/${open}`).catch(() => '')).replace(/\r/g, '').replace(/\t/g, '  ').split('\n')
  return { id: `m${await $.clock.now()}`, ...s, head: (src[s.line - 1] ?? '').slice(0, 20), ...(text ? { text } : {}) }
}

// 같은 줄 같은 종류끼리 합친다: 잘함은 겹치면 범위를 합치고 별 수(n) +1,
// 취소선은 겹치거나 사이가 공백뿐이면 한 줄로 이어 붙임 (개수 안 늘어남). 나머지는 그냥 추가.
export function addMark(marks: PanelMark[], m: PanelMark, text: string): PanelMark[] {
  if (m.kind !== 'good' && m.kind !== 'strike') return [...marks, m]
  const chars = [...text]
  const near = (x: PanelMark) => x.line === m.line && x.kind === m.kind && (m.kind === 'good'
    ? x.c0 < m.c1 && m.c0 < x.c1
    : !/\S/.test(chars.slice(Math.min(x.c1, m.c1), Math.max(x.c0, m.c0)).join('')))
  const hit = marks.filter(near)
  if (!hit.length) return [...marks, m]
  const all = [...hit, m]
  const merged: PanelMark = { ...hit[0], c0: Math.min(...all.map(x => x.c0)), c1: Math.max(...all.map(x => x.c1)) }
  if (m.kind === 'good') merged.n = all.reduce((s, x) => s + (x.n ?? 1), 0)
  return [...marks.filter(x => !hit.includes(x)), merged]
}

// 입력칸 [보내기]: 새 말구름·끼워넣기를 저장, 고치는 중이면 글만 바꾸고, 빈 글이면 지운다
async function commitEdit($: EngineInterface, text: string): Promise<void> {
  const edit = await read($, editAtom)
  const open = await read($, openAtom)
  await update($, editAtom, () => null)
  const t = text.trim()
  if (!edit || !open) return
  let marks = await loadMarks($, open)
  if (edit.id) marks = marks.flatMap(m => (m.id !== edit.id ? [m] : t ? [{ ...m, text: t }] : []))
  else if (t) marks.push(await newMark($, open, edit, t))
  await saveMarks($, open, marks)
  await update($, tickAtom, n => n + 1)
}

async function loadTabs($: EngineInterface): Promise<PanelTab[]> {
  try {
    const list = JSON.parse(await $.fs.read(TABS_FILE))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

async function saveTabs($: EngineInterface, tabs: PanelTab[]): Promise<void> {
  await $.fs.write(TABS_FILE, JSON.stringify(tabs, null, 2) + '\n') // 폴더가 없으면 만들어 준다
}

// 제목 → 파일 이름 (영어·숫자는 그대로, 나머지는 시각으로 대신)
function newId(title: string, now: number): string {
  const ascii = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return ascii.length >= 2 ? ascii : `tab-${now}`
}

type Row = { path: string; name: string; depth: number; isDir: boolean; guide: string }

async function treeRows($: EngineInterface, expanded: string[]): Promise<Row[]> {
  const rows: Row[] = []
  // prefix = the guide lines of the ancestors ('│ ' while that ancestor has more siblings below)
  const walk = async (rel: string, depth: number, prefix: string) => {
    const entries = await $.fs.list(rel ? `${ROOT}/${rel}` : ROOT).catch(() => [])
    const kept = entries
      .filter(x => !SKIP.has(x.name) && x.kind !== 'other')
      .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1))
    for (const [i, x] of kept.entries()) {
      const path = rel ? `${rel}/${x.name}` : x.name
      const last = i === kept.length - 1
      rows.push({ path, name: x.name, depth, isDir: x.kind === 'dir', guide: depth ? prefix + (last ? '└ ' : '├ ') : '' })
      if (x.kind === 'dir' && expanded.includes(path) && depth < 6) await walk(path, depth + 1, depth ? prefix + (last ? '  ' : '│ ') : '')
    }
  }
  await walk('', 0, '')
  return rows
}

// 그림판: 원본은 sketches/base-*.png, 패널에는 줄인 픽셀만. 보낼 때 선을 원본 위에 자홍색으로 그린다.
let HOOKS = ''

async function ps($: EngineInterface, script: string, args: string[]): Promise<Record<string, unknown>> {
  const r = await $.process.run(['powershell', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', `${HOOKS}/${script}`, ...args])
  try {
    return JSON.parse(r.stdout.trim().split('\n').pop() ?? '{}')
  } catch {
    return { error: (r.stderr || r.stdout).trim().slice(0, 200) || tr('unknownErr') }
  }
}

async function loadCanvas($: EngineInterface, source: 'clip' | 'blank', maxW: number, maxH: number): Promise<void> {
  const j = await ps($, 'sketch-load.ps1', ['-Source', source, '-Dir', SKETCH_DIR, '-MaxW', String(maxW), '-MaxH', String(maxH)])
  if (j.error) return void $.ui.toast(String(j.error))
  await update($, canvasAtom, () => ({ base: String(j.base), w: Number(j.w), h: Number(j.h), px: j.px as string[] }))
  await update($, strokesAtom, () => [])
  await update($, clearAtom, n => n + 1)
}

async function sendCanvas($: EngineInterface): Promise<void> {
  const cv = await read($, canvasAtom)
  if (!cv) return
  const d = new Date(await $.clock.now())
  const p2 = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`
  const out = `${SKETCH_DIR}/sketch-${stamp}.png`
  const strokesFile = `${SKETCH_DIR}/.strokes.json`
  await $.fs.write(strokesFile, JSON.stringify(await read($, strokesAtom)))
  const j = await ps($, 'sketch-save.ps1', ['-Base', cv.base, '-StrokesFile', strokesFile, '-W', String(cv.w), '-H', String(cv.h), '-Out', out])
  if (j.error) return void $.ui.toast(tr('saveFail', { err: String(j.error) }))
  void $.prompt.fill({ text: tr('fillSketch', { out }), mode: 'append' })
}

// 글 보기(viewer.tsx): 끌어서 고른 범위(sel), 표시 칸 클릭(gutter)
async function viewerMessage($: EngineInterface, e: { data?: unknown }) {
  const open = await read($, openAtom)
  const d = e.data as { sel?: { line: number; c0: number; c1: number }; gutter?: { line: number } }
  if (!open || !d) return {}
  const marks = await loadMarks($, open)
  if (d.gutter) {
    const m = marks.find(x => x.line === d.gutter!.line && (x.kind === 'cloud' || x.kind === 'caret'))
    if (m) {
      await update($, draftAtom, () => m.text ?? '')
      await update($, editAtom, () => ({ id: m.id, line: m.line, c0: m.c0, c1: m.c1, kind: m.kind, text: m.text ?? '' }))
    }
  } else if (d.sel) {
    const s = d.sel
    const tool = await read($, toolAtom)
    if (tool === 'cloud' || tool === 'caret') {
      await update($, draftAtom, () => '')
      await update($, editAtom, () => ({ ...s, kind: tool, text: '' }))
    } else {
      let rest: PanelMark[]
      if (tool === 'erase') rest = marks.filter(m => !(m.line === s.line && m.c0 < s.c1 && s.c0 < m.c1))
      else {
        const src = (await $.fs.read(`${ROOT}/${open}`).catch(() => '')).replace(/\r/g, '').replace(/\t/g, '  ').split('\n')
        // 옛 표시도 같이 다시 묶는다 (합치기 전에 저장된 것들)
        rest = [...marks, await newMark($, open, { ...s, kind: tool })].reduce<PanelMark[]>((acc, m) => addMark(acc, m, src[m.line - 1] ?? ''), [])
      }
      await saveMarks($, open, rest)
    }
  }
  await update($, tickAtom, n => n + 1)
  return {}
}

let OPTS: Readonly<Record<string, unknown>> = {}
let READY = false
// Paths come from the engine; filled once, by whichever hook runs first (a render can come before session.start).
async function init($: EngineInterface) {
  if (READY) return
  READY = true
  // Each value has a fallback so the panel still draws where the host lacks one (tests, other hosts).
  ROOT = (await $.session.root().catch(() => '')).replace(/\\/g, '/').replace(/\/+$/, '')
  setRoot(ROOT)
  TITLE = ROOT.split('/').pop() || ROOT
  const profile = await $.env.get('USERPROFILE').catch(() => undefined)
  const home = (profile ?? (await $.env.get('HOME').catch(() => undefined)) ?? '').replace(/\\/g, '/')
  TABS_DIR = String(OPTS.tabsDir || '') || `${home}/.claude/choboza-pack/panel`
  TABS_FILE = `${TABS_DIR}/tabs.json`
  SKETCH_DIR = `${TABS_DIR}/sketches`
  HOOKS = `${String($.plugin.root).replace(/\\/g, '/')}/hooks`
  IS_WINDOWS = (await $.env.get('OS').catch(() => undefined)) === 'Windows_NT'
}

export const register: Register = (on, options) => {
  OPTS = options
  setLang(String(options.language ?? 'auto'))
  setIcons(String(options.icons ?? 'nerd'))
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'panel', description: tr('cmdDesc') })
    await init($)
    if (options.autoOpen) void openPane($)
    // 1.5초마다 보고 있는 파일·메모가 바뀌었으면 다시 그린다 (토큰 안 듦)
    let seen = ''
    $.clock.every(1500, () => void (async () => {
      const tab = await read($, tabAtom)
      if (tab === 'tree') {
        if (anyFresh(await read($, touchesAtom), Date.now())) await update($, tickAtom, n => n + 1)
        return
      }
      if (tab === 'sketch' || tab === 'replay') return
      const open = await read($, openAtom)
      const sig = (await $.fs.read(`${TABS_DIR}/${tab}.md`).catch(() => '')) + '\u0000'
        + (open ? await $.fs.read(`${ROOT}/${open}`).catch(() => '') : '')
      if (sig !== seen) { seen = sig; await update($, tickAtom, n => n + 1) }
    })())
    return next(e)
  })

  on('command.run', { command: 'panel' }, async $ => {
    await init($)
    await openPane($)
    return { text: tr('panelOpened') }
  })

  // 그림판(canvas.tsx)이 한 획 끝날 때마다 보내는 선
  on('ui.message', async ($, e, next) => {
    // 글 보기 Client 키는 viewer:<a|b|all>:<off> (쪽마다 새로 그리려고)
    if (e.requestId === PANE && e.element?.startsWith('viewer:')) return viewerMessage($, e)
    if (e.requestId !== PANE || e.element !== 'canvas') return next(e)
    const strokes = (e.data as { strokes?: number[][][] })?.strokes
    if (Array.isArray(strokes)) await update($, strokesAtom, () => strokes)
    return {}
  })


  // Claude 가 탭 내용을 고쳤을 수 있으니 답이 끝날 때마다 다시 그린다
  on('turn.complete', async ($, e, next) => {
    const pending = await read($, pendingAtom)
    if (pending.length) {
      await update($, stepsAtom, () => pending)
      await update($, pendingAtom, () => [])
      await update($, rstepAtom, () => 0)
      if ((await read($, tabAtom)) !== 'replay') await update($, dotsAtom, d => ({ ...d, replay: true }))
    }
    await update($, tickAtom, n => n + 1)
    return next(e)
  })

  // Which files Claude reads/edits (tree colors) and what it changed (replay). Never blocks or changes the call.
  on('tool.call', async ($, e, next) => {
    const input = e as unknown as Record<string, unknown>
    const touch = touchOf(e.tool, input)
    if (!touch) return next(e)
    const before = e.tool === 'Write' && typeof input.file_path === 'string' ? await $.fs.read(input.file_path).catch(() => null) : null
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) return ran
    await update($, touchesAtom, l => addTouch(l, { ...touch, at: Date.now() }))
    if (touch.kind === 'edit') {
      const step = stepOf(e.tool, input, before)
      if (step) await update($, pendingAtom, p => [...p, step].slice(-100))
    }
    if ((await read($, tabAtom)) !== 'tree') await update($, dotsAtom, d => (d.tree ? d : { ...d, tree: true }))
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await init($)
    const { Box, Text, Button, Input, Markdown, Client } = $.ui.resolve(e)
    await read($, tickAtom)
    const tab = await read($, tabAtom)
    const adding = await read($, addingAtom)
    const wide = await read($, wideAtom)
    const offsets = await read($, offsetsAtom)
    const tabs = await loadTabs($)

    // 패널 전체를 엔진이 주는 칸(bodyRows)에 딱 맞춘다: 엔진은 스크롤할 게 없고,
    // 내용 칸만 우리가 따로 스크롤, 아래 탭 줄은 그 자리에 고정.
    const bodyRows = e.props.scroll?.bodyRows || Math.max(10, (e.viewport?.rows ?? 30) - 4)
    const barRows = 2 + (adding ? 3 : 0) // 구분선 + 탭 줄 (+ 새 탭 제목 칸)
    const contentH = Math.max(3, bodyRows - barRows)

    // items: 한 줄짜리 요소들. 넘치면 ▲▼ 로 넘긴다.
    let items: unknown[] = []
    let fixed: unknown = null // 스크롤하지 않는 내용 (그림판)
    let viewer: { open: string; rows: unknown[]; nw: number; bar: unknown } | null = null // 글 보기

    if (tab === 'sketch') {
      const cv = await read($, canvasAtom)
      const strokes = await read($, strokesAtom)
      // 칸 수 1000 이하 (덩어리로 묶어도 사진처럼 색이 잘게 바뀌면 크기 제한을 넘을 수 있어서)
      const maxW = Math.max(16, Math.min(48, (e.props.bodyColumns || 40) - 1))
      const maxH = Math.max(8, Math.min(64, (contentH - 4) * 2, Math.floor(2000 / maxW)))
      fixed = (
        <Box flexDirection="column">
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            <Button key="sk:clip" onPress={() => void loadCanvas($, 'clip', maxW, maxH)}>{tr('btnClipboard')}</Button>
            <Button key="sk:blank" onPress={() => void loadCanvas($, 'blank', maxW, maxH)}>{tr('btnBlank')}</Button>
            {cv ? <Button key="sk:clear" onPress={async () => { await update($, strokesAtom, () => []); await update($, clearAtom, n => n + 1) }}>{tr('btnClear')}</Button> : null}
            {cv ? <Button key="sk:send" variant="primary" onPress={() => void sendCanvas($)}>{tr('btnSend')}</Button> : null}
          </Box>
          {cv
            ? <Client key="canvas" module="./canvas.tsx" props={{ w: cv.w, h: cv.h, px: cv.px, clear: await read($, clearAtom) }} width={cv.w} height={Math.ceil(cv.h / 2)} />
            : <Text dimColor>{tr('sketchHint')}</Text>}
          {cv ? <Text dimColor>{tr('sketchDraw')}</Text> : null}
          {cv ? <Text color={strokes.length ? 'success' : 'warning'}>{tr('strokesGot', { n: strokes.length })}</Text> : null}
        </Box>
      )
    } else if (tab === 'replay') {
      const steps = await read($, stepsAtom)
      const w = Math.max(10, (e.props.bodyColumns || 40) - 1)
      const fit = (s: string) => ([...s].length > w ? [...s].slice(0, w - 1).join('') + '…' : s)
      if (!steps.length) {
        items.push(<Text key="rp:none" dimColor>{fit(tr('replayNone1'))}</Text>)
        items.push(<Text key="rp:none2" dimColor>{fit(tr('replayNone2'))}</Text>)
      } else {
        const k = Math.min(await read($, rstepAtom), steps.length - 1)
        const s = steps[k]
        const d = diffOf(s.before, s.after)
        const go = (n: number) => void update($, rstepAtom, () => Math.max(0, Math.min(steps.length - 1, n)))
        items.push(
          <Box key="rp:nav" flexDirection="row" gap={1}>
            <Button key="rp:prev" plain onPress={() => go(k - 1)}><Text dimColor={k === 0}>◀</Text></Button>
            <Text bold>{`${k + 1}/${steps.length}`}</Text>
            <Button key="rp:next" plain onPress={() => go(k + 1)}><Text dimColor={k === steps.length - 1}>▶</Text></Button>
            <Text color="#5FD068">{`+${d.added}`}</Text>
            <Text color="#FF6B6B">{`-${d.removed}`}</Text>
          </Box>,
        )
        items.push(<Text key="rp:file" color={HEAT.edit[0]} bold>{fit(`${iconOf(s.path.split('/').pop() ?? '', false, false)} ${s.path} (${s.tool})`)}</Text>)
        d.lines.forEach((l, i) =>
          items.push(<Text key={`rp:l${i}`} color={l.sign === '+' ? '#5FD068' : '#FF6B6B'}>{fit(`${l.sign} ${l.text.replace(/\t/g, '  ')}`)}</Text>))
        if (d.added + d.removed > d.lines.length) items.push(<Text key="rp:more" dimColor>{tr('moreLines', { n: d.added + d.removed - d.lines.length })}</Text>)
      }
    } else if (tab !== 'tree') {
      const t = tabs.find(x => x.id === tab)
      if (!t) {
        void update($, tabAtom, () => 'tree')
      } else {
        const open = await read($, openAtom)
        const view = await read($, viewAtom)
        const showFile = !!open && view === 'file'
        const toggle = (id: 'memo' | 'file', label: string) => (
          <Button key={`v:${id}`} plain onPress={() => void update($, viewAtom, () => id)}>
            <Text bold={view === id} color={view === id ? 'suggestion' : undefined} inverse={view === id}>{` ${label} `}</Text>
          </Button>
        )
        const bar = (
          <Box key="v:bar" flexDirection="row" gap={1}>
            {toggle('memo', tr('viewMemo'))}
            {toggle('file', open)}
          </Box>
        )
        if (open && !showFile) items.push(bar)
        if (showFile) {
          // 줄 번호 + 표시 칸 + 본문 (viewer.tsx 가 그림). 본문은 보기만, 고치는 건 Claude 에게 말해서.
          const text = await $.fs.read(`${ROOT}/${open}`).catch(() => null)
          const lines = (text ?? tr('fileUnreadable')).replace(/\r/g, '').replace(/\t/g, '  ').split('\n')
          const nw = String(lines.length).length
          const bw = Math.max(10, (e.props.bodyColumns || 40) - 1 - nw - 6) // 6 = 번호 뒤 칸 + 표시 4칸 + │
          const rows: { line: number; off: number; t: string; first: boolean; note?: boolean; caret?: boolean }[] = []
          const allMarks = await loadMarks($, open)
          const noted = allMarks.filter(m => m.text)
          const clouds = allMarks.filter(m => m.kind === 'cloud')
          lines.forEach((ln, i) => {
            let off = 0
            wrap(ln, bw).forEach((part, j) => {
              rows.push({ line: i + 1, off, t: part, first: j === 0 })
              off += [...part].length
            })
            // 말구름·끼워넣기 글: 그 줄 바로 아래에 (viewer 가 흐린 글씨로 그린다)
            // 끼워넣기(^)는 AI 에게 하는 지시라 말구름보다 먼저
            const here = noted.filter(x => x.line === i + 1).sort((a, b) => Number(b.kind === 'caret') - Number(a.kind === 'caret'))
            for (const m of here) {
              const tag = m.kind === 'cloud' ? `(${clouds.indexOf(m) + 1})` : '^'
              wrap(`${tag} ${m.text}`, bw).forEach((part, j) =>
                rows.push({ line: i + 1, off: -1, t: part, first: false, note: true, ...(m.kind === 'caret' && j === 0 ? { caret: true } : {}) }))
            }
          })
          viewer = { open, rows, nw, bar }
          items = rows
        } else {
          const body = (await $.fs.read(`${TABS_DIR}/${t.id}.md`).catch(() => '')).trim()
          ;(body ? body.split('\n') : [tr('tabEmpty'), tr('tabFile', { path: `${TABS_DIR}/${t.id}.md` })])
            .forEach((ln, i) => items.push(body ? <Markdown key={`md:${t.id}:${i}`} text={ln || ' '} /> : <Text dimColor>{ln}</Text>))
          // 끌기를 놓은 자리가 이 버튼이면 바로 지워졌음 → 두 번 눌러야 지움
          const sure = (await read($, delAtom)) === t.id
          items.push(
            <Button key={`del:${t.id}`} plain onPress={async () => {
              if ((await read($, delAtom)) !== t.id) return void update($, delAtom, () => t.id)
              await update($, delAtom, () => '')
              await saveTabs($, (await loadTabs($)).filter(x => x.id !== t.id))
              await update($, tabAtom, () => 'tree')
            }}>
              <Text color={sure ? 'error' : undefined} dimColor={!sure}>{sure ? tr('delSure') : tr('delAsk')}</Text>
            </Button>,
          )
        }
      }
    } else {
      const expanded = await read($, expandedAtom)
      const touches = await read($, touchesAtom)
      const now = Date.now()
      const treeW = Math.max(10, (e.props.bodyColumns || 40) - 1)
      items = (await treeRows($, expanded)).map(r => {
        const open = r.isDir && expanded.includes(r.path)
        const heat = heatOf(touches, r.path, r.isDir && !open, now)
        const color = heat ? HEAT[heat.kind][heat.hot ? 0 : 1] : undefined
        const tag = heat?.hot ? (heat.kind === 'edit' ? ' \uf040' : ' \uf06e') : ''
        return (
        <Button
          key={`f:${r.path}`}
          plain
          onPress={async () => {
            if (r.isDir) {
              return void update($, expandedAtom, list =>
                list.includes(r.path) ? list.filter(p => p !== r.path && !p.startsWith(r.path + '/')) : [...list, r.path])
            }
            void $.prompt.fill({ text: `${ROOT}/${r.path} `, mode: 'append' })
            // 글 파일이면 첫 내 탭에서 보여 준다 (보기만)
            const mine = (await loadTabs($))[0]
            if (!mine || !TEXT_EXT.test(r.path)) return
            await update($, openAtom, () => r.path)
            await update($, viewAtom, () => 'file')
            await update($, offsetsAtom, o => ({ ...o, [mine.id]: 0 }))
            await update($, tabAtom, () => mine.id)
          }}
        >
          <Text>
            <Text color={GUIDE_COLOR}>{r.guide}</Text>
            <Text color={color ?? iconColorOf(r.name, r.isDir)}>{iconOf(r.name, r.isDir, open) + ' '}</Text>
            <Text color={color ?? (r.isDir ? '#E6E9EF' : r.name.startsWith('.') ? '#A9B0BA' : '#BFC5CE')} bold={r.isDir || !!heat?.hot} italic={r.name.startsWith('.')}>
              {fitCells(r.name, treeW - cellsOf(r.guide) - 2 - cellsOf(tag)) + tag}
            </Text>
          </Text>
        </Button>
        )
      })
    }

    // 넘칠 때만 스크롤: 내용이 칸보다 짧으면 ▲▼ 도 안 나온다
    // 글 보기는 위에 전환줄(1) + 도구줄(2) (+ 입력칸 4) 이 있어서 본문 칸이 그만큼 줄어든다
    const edit = viewer ? await read($, editAtom) : null
    const pageH = viewer ? Math.max(3, contentH - 3 - (edit ? 4 : 0)) : contentH
    const maxOff = Math.max(0, items.length - pageH)
    const off = Math.min(offsets[tab] ?? 0, maxOff)
    const scrollTo = (n: number) => update($, offsetsAtom, o => ({ ...o, [tab]: Math.max(0, Math.min(maxOff, n)) }))
    const step = Math.max(1, pageH - 1)

    if (viewer) {
      const tool = await read($, toolAtom)
      const marks = await loadMarks($, viewer.open)
      const clouds = marks.filter(m => m.kind === 'cloud')
      const marksProp = marks.map(m => ({ id: m.id, line: m.line, c0: m.c0, c1: m.c1, kind: m.kind, ...(m.kind === 'cloud' ? { n: clouds.indexOf(m) + 1 } : m.n ? { n: m.n } : {}) }))
      // Labels must stay ASCII/Hangul/plain letters: ambiguous-width symbols (e.g. half circles, check marks) make terminal and engine cell widths disagree and clicks drift
      const tools: [string, string][] = [['strike', tr('toolStrike')], ['good', tr('toolGood')], ['bang', '!'], ['ask', '?'], ['caret', tr('toolCaret')], ['cloud', tr('toolCloud')], ['erase', tr('toolErase')]]
    const page = viewer.rows.slice(off, off + pageH) as { line: number; note?: boolean }[]
    const at = edit ? page.map(r => r.line === edit.line && !r.note).lastIndexOf(true) : -1 // 표시한 줄의 마지막 칸
    const box = edit ? (
      <Box flexDirection="column">
        <Input
          key={`mark-input:${edit.id ?? `${edit.line}:${edit.c0}`}`}
          label={edit.kind === 'cloud' ? tr('toolCloud') : tr('inputInsert')}
          value={edit.text}
          autoFocus
          submitLabel={tr('submit')}
          onInput={t => void update($, draftAtom, () => t)}
          onSubmit={t => void commitEdit($, t)}
        />
        <Box flexDirection="row" gap={2}>
          <Button key="mark-ok" plain onPress={async () => void commitEdit($, await read($, draftAtom))}><Text color="success">{tr('btnSubmit')}</Text></Button>
          <Button key="mark-cancel" plain onPress={() => void update($, editAtom, () => null)}><Text dimColor>{tr('btnCancel')}</Text></Button>
        </Box>
      </Box>
    ) : null
    // 쪽·줄이 바뀌면 새로 그려서 마우스 처리가 지금 줄을 쓰게 한다
    const view = (rows: unknown[], tag: string) => rows.length ? (
      <Client
        key={`viewer:${tag}:${off}`}
        module="./viewer.tsx"
        props={{ rows: rows as never, marks: marksProp as never, nw: viewer!.nw }}
        width={Math.max(10, (e.props.bodyColumns || 40) - 1)}
        height={rows.length}
      />
    ) : null

      fixed = (
        <Box flexDirection="column">
          {viewer.bar as never}
          <Box flexDirection="row" flexWrap="wrap">
            {tools.map(([id, label]) => (
              <Button key={`tool:${id}`} plain onPress={() => void update($, toolAtom, () => id)}>
                <Text bold={tool === id} color={tool === id ? 'suggestion' : undefined} inverse={tool === id}>{` ${label} `}</Text>
              </Button>
            ))}
          </Box>
          {at < 0 ? box : view(page.slice(0, at + 1), 'a')}
          {at < 0 ? view(page, 'all') : box}
          {at < 0 ? null : view(page.slice(at + 1), 'b')}
        </Box>
      )
    }

    const dots = await read($, dotsAtom)
    const dotOf = (id: string) => (id === 'tree' || id === 'replay') && tab !== id && dots[id]
    const tabButton = (id: string, label: string) => (
      <Button key={`t:${id}`} plain onPress={async () => {
        await update($, tabAtom, () => id)
        if (id === 'tree' || id === 'replay') await update($, dotsAtom, d => ({ ...d, [id]: false }))
      }}>
        <Text bold={tab === id} color={tab === id ? 'suggestion' : undefined} inverse={tab === id}>{` ${label}${dotOf(id) ? ' ●' : ''} `}</Text>
      </Button>
    )
    const width = Math.max(10, (e.props.bodyColumns || 40) - 1)

    return (
      <Box flexDirection="column" height={bodyRows}>
        <Box flexDirection="column" height={contentH} overflow="hidden">
          {(fixed ?? items.slice(off, off + contentH)) as never}
        </Box>
        {/* 아래 고정: 엑셀 시트 탭처럼 */}
        {adding ? (
          <Input
            key="new-tab"
            label={tr('newTabLabel')}
            placeholder={tr('newTabPlaceholder')}
            autoFocus
            onSubmit={async title => {
              const name = title.trim()
              if (!name) return
              const id = newId(name, await $.clock.now())
              await saveTabs($, [...(await loadTabs($)).filter(t => t.id !== id), { id, title: name }])
              await update($, addingAtom, () => false)
              await update($, tabAtom, () => id)
              // 합의하러 가기: 입력창에 문장을 채워 두기만 한다 (보내는 건 사람이)
              void $.prompt.fill({ text: tr('fillNewTab', { name, path: `${TABS_DIR}/${id}.md` }) })
            }}
          />
        ) : null}
        <Text dimColor>{'─'.repeat(width)}</Text>
        <Box flexDirection="row" flexWrap="nowrap" overflow="hidden" gap={1}>
          <Button key="t:size" plain onPress={() => void (async () => { await update($, wideAtom, w => !w); await openPane($) })()}>
            <Text color="suggestion">{wide ? '▶◀' : '◀▶'}</Text>
          </Button>
          {tabButton('tree', wide ? tr('tabTree') : tr('tabTreeS'))}
          {IS_WINDOWS ? tabButton('sketch', wide ? tr('tabSketch') : tr('tabSketchS')) : null}
          {tabButton('replay', wide ? tr('tabReplay') : tr('tabReplayS'))}
          {tabs.map(t => tabButton(t.id, t.title))}
          <Button key="t:add" plain onPress={() => void update($, addingAtom, a => !a)}>
            <Text color="success">{adding ? ' × ' : ' ＋ '}</Text>
          </Button>
          {maxOff > 0 ? (
            <Box flexDirection="row" gap={1}>
              <Button key="s:up" plain hotkey="k" onPress={() => void scrollTo(off - step)}><Text dimColor={off === 0}>▲</Text></Button>
              <Button key="s:down" plain hotkey="j" onPress={() => void scrollTo(off + step)}><Text dimColor={off >= maxOff}>▼</Text></Button>
              <Text dimColor>{`${off + 1}-${Math.min(items.length, off + pageH)}/${items.length}`}</Text>
            </Box>
          ) : null}
        </Box>
      </Box>
    )
  })
}
