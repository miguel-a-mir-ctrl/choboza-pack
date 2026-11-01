import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage } from 'claude-code'

import type { Act, Info, Limit, Mark, Sys } from '../types'

const limitsAtom = atom({ plugin: 'usage-line', key: 'limits' } as const, null)
const sysAtom = atom({ plugin: 'usage-line', key: 'sys' } as const, null)
const infoAtom = atom({ plugin: 'usage-line', key: 'info' } as const, null)
const markAtom = atom({ plugin: 'usage-line', key: 'mark' } as const, null)
const actAtom = atom({ plugin: 'usage-line', key: 'act' } as const, null)
const frameAtom = atom({ plugin: 'usage-line', key: 'frame' } as const, null)

// Written for the AI to read (usage, context, advice); set at session start under the user's home.
let STATE_FILE = ''
const NEW_ACT: Act = { doneAt: 0, idleBack: false, told: null, open: false }

// Rules agreed with Opus (2026-11-01): judge by token count, not %.
// new = new session better, compact = /compact fine, both = either is fine
export type Advice = { kind: 'new' | 'compact' | 'both' | null; why: string }
export function advise(tokens: number, m: Mark | null, idleBack: boolean): Advice {
  const k = `${Math.round(tokens / 1000)}k`
  if (idleBack) return { kind: 'new', why: `1시간 넘게 쉬었다 옴 + ${k} → 컴팩보다 새 세션` }
  const pending = m?.pending ?? 0
  const done = !!m?.off && pending === 0 // committed, nothing left = README is current
  if (tokens >= 400_000) {
    if (done) return { kind: 'new', why: `${k} ≥ 400k, 커밋까지 끝남 → 새 세션` }
    if (pending > 0) return { kind: 'compact', why: `${k} ≥ 400k, 할 일 ${pending}개 남음 → 일 끊기는 곳에서 컴팩` }
    return { kind: 'both', why: `${k} ≥ 400k → 일 끊기는 곳에서 컴팩이나 새 세션` }
  }
  if (tokens >= 150_000 && done) return { kind: 'new', why: `${k} ≥ 150k, 일 하나 끝남(커밋) → 새 세션` }
  return { kind: null, why: `${k}: 괜찮음 (150k + 일 끝남, 400k, 1시간 쉼 뒤 100k 에서 알림)` }
}
const ADVICE_TEXT = { new: '새 세션 요망', compact: '컴팩', both: '컴팩 · 새 세션' }
// one line for the model, sent only when the advice changes (0 tokens otherwise)
const ADVICE_AI = {
  new: 'suggest the user start a new session (save progress notes first)',
  compact: 'suggest /compact at the next stable point',
  both: 'suggest /compact or a new session at the next stable point',
}
export const notice = (tokens: number, a: Advice) =>
  `[usage-line] context ${Math.round(tokens / 1000)}k tokens: ${a.kind ? ADVICE_AI[a.kind] : 'fine'}.`

async function writeState($: EngineInterface) {
  const info = await read($, infoAtom)
  const limits = (await read($, limitsAtom)) ?? []
  const act = (await read($, actAtom)) ?? NEW_ACT
  const pct = (kind: string) => limits.find(x => x.kind === kind)?.percentUsed ?? null
  const a = advise(info?.tokens ?? 0, await read($, markAtom), act.idleBack)
  const state = {
    fiveHourPct: pct('five_hour'), weeklyPct: pct('seven_day'),
    contextTokens: info?.tokens ?? null, contextWindow: info?.window ?? null, contextPct: info?.percent ?? null,
    advice: a.kind, why: a.why, updatedAt: new Date().toISOString(),
  }
  if (STATE_FILE) await $.fs.write(STATE_FILE, JSON.stringify(state, null, 1)).catch(() => {})
}

// 원색 대신 흐린 색: 일하는 중 / 정리됨 / 할 일 남음
const MARK_COLOR = { on: '#8fb996', off: '#86a8c8', pending: '#c9b27c' }
// shortcut: 명령 글자만 봄 ("echo git commit" 도 OFF), 잘못 꺼지는 일이 잦으면 git 기록(HEAD 변화)으로 확인
const COMMIT = /\bgit\b[^\n;&|]*\bcommit\b/
const PENDING = /^\s*:\s*pending\s+(\d+)\s*$/

// 도구 호출 하나가 표시를 어떻게 바꾸는지. 상관없는 호출이면 그대로 돌려준다.
export function nextMark(old: Mark | null, tool: string, command: string): Mark | null {
  const m = old ?? { off: false, pending: 0 }
  if (tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit') return m.off ? { ...m, off: false } : old
  if (tool !== 'Bash' && tool !== 'PowerShell') return old
  const p = tool === 'Bash' ? PENDING.exec(command) : null
  if (p) return { ...m, pending: Number(p[1]) }
  return COMMIT.test(command) ? { ...m, off: true } : old
}

export function markView(m: Mark | null): { text: string; color: string } {
  if (m && m.pending > 0) return { text: `● ${m.pending}`, color: MARK_COLOR.pending }
  return m?.off ? { text: '● OFF', color: MARK_COLOR.off } : { text: '● ON', color: MARK_COLOR.on }
}

// Effort colors read from the real /effort screen (2026-11-01, tmux capture). [base, highlight]
const EFFORT_HEX: Record<string, [string, string]> = {
  low: ['#8A8A8A', '#D0D0D0'], medium: ['#3FA34D', '#A8E6B0'], high: ['#5769F7', '#B4BEFF'], xhigh: ['#8700FF', '#D0B4FF'],
}
const RAINBOW = ['#9B82C8', '#C882B4', '#EB5F57', '#F58B57', '#FAC35F', '#91C882']
export const FRAME_MS = 120
const SWEEP_PAUSE = 10 // frames of rest between two sweeps

// One color per letter for this frame: a light sweeps across the word; max cycles the rainbow.
export function shimmer(level: string, frame: number): { ch: string; color: string }[] {
  const chars = [...level]
  if (level === 'max') return chars.map((ch, i) => ({ ch, color: RAINBOW[(i + frame) % RAINBOW.length] }))
  const pair = EFFORT_HEX[level]
  if (!pair) return [{ ch: level, color: 'inactive' }]
  const pos = frame % (chars.length + SWEEP_PAUSE)
  return chars.map((ch, i) => ({ ch, color: i === pos ? pair[1] : pair[0] }))
}

// "claude-opus-5-5[1m]" → "Opus 5.5 1M", 별칭 "opus" → "Opus"
function modelName(id: string): string {
  const m = /claude-([a-z]+)-(\d+)(?:-(\d+))?/i.exec(id)
  const big = /\[1m\]/i.test(id) ? ' 1M' : ''
  if (!m) return id.charAt(0).toUpperCase() + id.slice(1) + big
  return `${m[1].charAt(0).toUpperCase()}${m[1].slice(1)} ${m[2]}${m[3] ? '.' + m[3] : ''}${big}`
}

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))

function contextText(i: Info, withTokens: boolean): string {
  if (!i.window) return ''
  return `문맥 ${i.percent ?? 0}%` + (withTokens && i.tokens ? ` (${short(i.tokens)}/${short(i.window)})` : '')
}

// 터미널 칸 수: 한글·한자는 2칸
export const cells = (s: string) => [...s].reduce((n, ch) => n + (/[ᄀ-ᇿ　-鿿가-힯＀-￯]/.test(ch) ? 2 : 1), 0)

const withContext = (old: Info | null, c: SessionContextUsage): Info =>
  ({ model: old?.model ?? '', effort: old?.effort, tokens: c.tokens, window: c.window, percent: c.percent })

const NAMES: Record<string, string> = { five_hour: '5시간', seven_day: '주간' }
const DAYS = ['일', '월', '화', '수', '목', '금', '토']

// 4초마다 CPU·RAM·GPU(Arc)·NPU(AI Boost) 사용률을 JSON 한 줄로 내보낸다.
// 필요한 장치의 카운터만 읽어서 가볍다 (코어 하나의 2~3%). Claude 가 꺼지면 4초 안에 스스로 끝난다.
const SYSMON = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
$parent = (Get-CimInstance Win32_Process -Filter "ProcessId=$PID").ParentProcessId
function Get-Luid($class, $skip) {
  $d = Get-PnpDevice -PresentOnly -Class $class | Where-Object { $_.FriendlyName -notmatch $skip } | Select-Object -First 1
  if (-not $d) { return $null }
  $v = [int64](Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName '{60b193cb-5276-4d0f-96fc-f173abad3ec6} 2').Data
  if (-not $v) { return $null }
  'luid_0x{0:x8}_0x{1:x8}' -f ($v -shr 32), ($v -band 0xffffffff)
}
$gpu = Get-Luid 'Display' 'Basic'
$npu = Get-Luid 'ComputeAccelerator' '^$'
$total = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
$paths = @('\Processor Information(_Total)\% Processor Utility', '\Memory\Available Bytes')
foreach ($l in @($gpu, $npu)) { if ($l) { $paths += "\GPU Engine(*$l*)\Utilization Percentage" } }
while ($true) {
  if ($parent -and -not (Get-Process -Id $parent)) { exit }
  $s = (Get-Counter $paths).CounterSamples
  $cpu = ($s | Where-Object Path -like '*processor utility').CookedValue
  $avail = ($s | Where-Object Path -like '*available bytes').CookedValue
  $eng = @{}
  foreach ($x in ($s | Where-Object Path -like '*gpu engine*')) {
    if ($x.InstanceName -match '(luid_0x[0-9a-f]+_0x[0-9a-f]+)_phys_\d+_eng_\d+_engtype_(.*)$') {
      $k = $Matches[1] + '|' + $Matches[2]
      $eng[$k] = $eng[$k] + $x.CookedValue
    }
  }
  $peak = { param($l) if (-not $l) { return -1 }; $m = 0; foreach ($k in $eng.Keys) { if ($k.StartsWith($l + '|') -and $eng[$k] -gt $m) { $m = $eng[$k] } }; [math]::Min(100, [math]::Round($m)) }
  $out = @{ cpu = [math]::Min(100, [math]::Round($cpu)); ram = [math]::Round(100 * (1 - $avail / $total)); ramGb = [math]::Round(($total - $avail) / 1GB, 1); gpu = (& $peak $gpu); npu = (& $peak $npu) }
  [Console]::Out.WriteLine(($out | ConvertTo-Json -Compress))
  [Console]::Out.Flush()
  Start-Sleep -Seconds 4
}
`

// PowerShell -EncodedCommand 는 UTF-16LE 를 base64 로 받는다 (따옴표 문제 없이 넘기려고)
function encodePs(script: string): string {
  const bytes: number[] = []
  for (let i = 0; i < script.length; i++) {
    const c = script.charCodeAt(i)
    bytes.push(c & 0xff, c >> 8)
  }
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    out += abc[(n >> 18) & 63] + abc[(n >> 12) & 63]
    out += i + 1 < bytes.length ? abc[(n >> 6) & 63] : '='
    out += i + 2 < bytes.length ? abc[n & 63] : '='
  }
  return out
}

// 초기화 시각: 오늘이면 "15:00", 아니면 "10/25(토) 15:00"
function resetText(iso: string | undefined, now: Date): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay ? hm : `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]}) ${hm}`
}

function line(limits: Limit[] | null): string {
  if (!limits || !limits.length) return '사용량 · 첫 응답 뒤에 표시'
  const now = new Date()
  const parts = ['five_hour', 'seven_day'].map(kind => {
    const w = limits.find(x => x.kind === kind)
    if (!w) return `${NAMES[kind]} -`
    const reset = resetText(w.resetsAt, now)
    return `${NAMES[kind]} ${w.percentUsed}%` + (reset ? ` (초기화 ${reset})` : '')
  })
  return '사용량 · ' + parts.join(' · ')
}

function sysLine(s: Sys | null): string {
  if (!s) return ''
  const pct = (v: number) => (v < 0 ? '-' : `${v}%`)
  return `CPU ${pct(s.cpu)} · RAM ${pct(s.ram)} (${s.ramGb}GB) · GPU ${pct(s.gpu)} · NPU ${pct(s.npu)}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.ui.status(undefined) // 예전 판의 상태 줄 지우기
    const usage = await $.session.usage()
    if (usage.rateLimits.length) await update($, limitsAtom, () => usage.rateLimits)
    const started = await next(e)
    const model = await $.session.model()
    await update($, infoAtom, old => ({ ...withContext(old, usage.context), model }))
    // Animation clock for the effort shimmer; the engine stops it when the mod unloads/reloads.
    $.clock.every(FRAME_MS, () => void update($, frameAtom, f => ((f ?? 0) + 1) % 100_000))
    // 세션 내내 도는 측정기. 모드가 꺼지거나 다시 불러오면 엔진이 같이 끈다.
    const profile = await $.env.get('USERPROFILE').catch(() => undefined)
    const home = (profile ?? (await $.env.get('HOME').catch(() => undefined)) ?? '').replace(/\\/g, '/')
    if (home) STATE_FILE = `${home}/.claude/usage_state.json`
    // CPU/RAM/GPU/NPU meter uses Windows PowerShell + perf counters; other systems skip it (the line just omits it).
    if ((await $.env.get('OS').catch(() => undefined)) === 'Windows_NT') void (async () => {
      const mon = $.process.spawn({
        argv: ['powershell', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodePs(SYSMON)],
      })
      let buf = ''
      for await (const { stream, text } of mon) {
        if (stream !== 'stdout') continue
        buf += text
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        const last = lines.map(l => l.trim()).filter(l => l.startsWith('{')).pop()
        if (!last) continue
        try {
          const s = JSON.parse(last) as Sys
          await update($, sysAtom, () => s)
        } catch {
          // 한 줄이 깨져도 다음 줄을 기다린다
        }
      }
    })()
    return started
  })

  on('session.measure', async ($, e, next) => {
    if (e.rateLimits.length) await update($, limitsAtom, () => e.rateLimits)
    if (e.changed.includes('context')) await update($, infoAtom, old => withContext(old, e.context))
    if (e.rateLimits.length || e.changed.includes('context')) await writeState($)
    return next(e)
  })

  // 모델 요청마다 실제로 쓰인 모델과 effort (하위 에이전트 요청은 빼고 메인 대화만)
  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) {
      await update($, infoAtom, old => ({ ...(old ?? { window: 0 }), model: e.model, effort: e.effort === undefined ? undefined : String(e.effort) }))
    }
    return yield* next(e)
  })

  // 성공한 호출만 본다: 실패한 커밋은 정리된 게 아니다
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) return ran
    const command = e.tool === 'Bash' || e.tool === 'PowerShell' ? e.command : ''
    const old = await read($, markAtom)
    const m = nextMark(old, e.tool, command)
    if (m !== old) await update($, markAtom, () => m)
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    await update($, actAtom, old => ({ ...(old ?? NEW_ACT), doneAt: Date.now() }))
    await writeState($)
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    await update($, actAtom, old => ({ ...(old ?? NEW_ACT), idleBack: false, told: null }))
    return r
  })

  // tell the model only when a threshold is crossed: one context line, nothing otherwise
  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta) return next(e)
    const tokens = (await read($, infoAtom))?.tokens ?? 0
    let act = (await read($, actAtom)) ?? NEW_ACT
    if (act.doneAt && Date.now() - act.doneAt > 3_600_000 && tokens >= 100_000) act = { ...act, idleBack: true }
    const a = advise(tokens, await read($, markAtom), act.idleBack)
    const tell = a.kind !== null && a.kind !== act.told
    await update($, actAtom, () => ({ ...act, told: a.kind }))
    return tell ? next({ ...e, context: [...(e.context ?? []), notice(tokens, a)] }) : next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const after = await next(e) // 다른 mod(Ponytail 등)가 그린 것은 이 줄 아래에
    const { Box, Text, Button } = $.ui.resolve(e)
    const act = (await read($, actAtom)) ?? NEW_ACT
    const sys = sysLine(await read($, sysAtom))
    const info = await read($, infoAtom)
    const level = info?.effort ?? '-'
    const frame = (await read($, frameAtom)) ?? 0
    const usage = line(await read($, limitsAtom))
    const model = info?.model ? modelName(info.model) + ' · effort ' : ''
    const rawMark = await read($, markAtom)
    const mark = markView(rawMark)
    const adv = advise(info?.tokens ?? 0, rawMark, act.idleBack)
    const advText = adv.kind ? ' · ' + ADVICE_TEXT[adv.kind] : ''
    const toggle = () => void update($, actAtom, old => ({ ...(old ?? NEW_ACT), open: !(old?.open ?? false) }))
    // 한 줄에 안 들어가면 먼저 문맥 토큰 수 (704k/1M) 를 빼고, 그래도 넘치면 사이 칸을 좁힌다
    const room = e.props.bodyColumns || 200
    const fits = (gap: string, ctxText: string) =>
      cells(usage + (sys ? gap + sys : '') + (model ? gap + model + level + ' ' + mark.text : '') + (ctxText ? ' · ' + ctxText : '') + advText) <= room
    const full = info ? contextText(info, true) : ''
    const brief = info ? contextText(info, false) : ''
    const [gap, ctx] = fits('     ', full) ? ['     ', full] : fits('     ', brief) ? ['     ', brief] : ['   ', brief]
    // 'permission' = 터미널에서 `코드` 글씨에 쓰이는 연보라색. 시스템 값과 모델은 띄어서 흐리게.
    const row = (
      <Box flexDirection="row" flexWrap="wrap">
        <Text color="permission">{usage}</Text>
        {sys ? <Text dimColor>{gap + sys}</Text> : null}
        {info?.model ? <Text dimColor>{gap + model}</Text> : null}
        {info?.model ? shimmer(level, frame).map(({ ch, color }, i) => <Text key={`fx${i}`} color={color} bold>{ch}</Text>) : null}
        {info?.model ? <Text color={mark.color}>{' ' + mark.text}</Text> : null}
        {info?.model && ctx ? <Text dimColor>{' · '}</Text> : null}
        {info?.model && ctx ? (
          <Button key="ctx" plain onPress={toggle}>
            <Text dimColor>{ctx}</Text>
            {adv.kind ? <Text color="warning" bold>{advText}</Text> : null}
          </Button>
        ) : null}
      </Box>
    )
    const why = act.open && info?.model ? <Text color="warning">{'문맥 조언 · ' + adv.why + '  (다시 누르면 닫힘)'}</Text> : null
    const top = why ? <Box flexDirection="column">{row}{why}</Box> : row
    return after ? <Box flexDirection="column">{top}{after}</Box> : top
  })
}
