import type { ClientModule } from 'claude-code'

// 글 보기: 줄 번호 + 표시 칸 + 본문. 마우스로 글자 범위를 끌면 server 로 보낸다.
// 칸 번호는 터미널 칸 기준 (한글 2칸), 보내는 위치(c0, c1)는 글자 번호.
type Row = { line: number; off: number; t: string; first: boolean; note?: boolean; caret?: boolean }
type Mark = { id: string; line: number; c0: number; c1: number; kind: string; n?: number }
type Props = { rows: Row[]; marks: Mark[]; nw: number }
type State = { a: [number, number] | null; b: [number, number] | null } // [줄 위치, 칸]

const MW = 4 // 표시 칸 너비
const cols = (s: string) => [...s].reduce((n, c) => n + ((c.codePointAt(0) ?? 0) >= 0x1100 ? 2 : 1), 0)

// 칸 → 이 줄 안의 글자 번호 (줄 끝을 넘으면 글자 수)
export function charAt(t: string, col: number): number {
  let acc = 0
  const chars = [...t]
  for (let i = 0; i < chars.length; i++) {
    const w = cols(chars[i])
    if (col < acc + w) return i
    acc += w
  }
  return chars.length
}

// 끌기 범위 → 한 줄 안의 [시작, 끝) 글자. 다른 줄로 끌면 첫 줄 안으로 자른다.
export function span(rows: Row[], a: [number, number], b: [number, number], gw: number): { line: number; c0: number; c1: number } {
  const row = rows[a[0]]
  const len = [...row.t].length
  const ia = charAt(row.t, a[1] - gw)
  const ib = b[0] === a[0] ? charAt(row.t, b[1] - gw) : b[0] > a[0] ? len - 1 : 0
  const lo = Math.min(ia, ib)
  const hi = Math.min(len, Math.max(ia, ib) + 1)
  return { line: row.line, c0: row.off + lo, c1: row.off + Math.max(hi, lo + 1) }
}

// '─' 는 이 터미널에서 2칸으로 그려져 본문이 밀렸음 → ASCII '-'
const GLYPH: Record<string, string> = { good: '*', bang: '!', ask: '?', caret: '^', strike: '-' }
// 종류마다 색이 달라서 한눈에 구별 (밑줄은 잘함·끼워넣기·말구름만)
const COLOR: Record<string, string> = { strike: '#ff6b6b', good: '#ffd700', bang: '#ff9f43', ask: '#4fc3f7', caret: '#b39ddb', cloud: '#b39ddb' }

const Viewer: ClientModule<Props, State> = (p, s) => {
  const { Box, Text } = s.elements
  const gw = p.nw + MW + 2
  if (!s.state) s.setState({ a: null, b: null })
  // 그릴 때마다 다시 건다: 한 번만 걸면 처음 줄 배치(p.rows)를 계속 써서, 메모 줄이 생기거나 없어진 뒤 엉뚱한 줄을 지움
  s.onPointer(ev => {
    const cur = s.state
    if (!cur || ev.button !== 'left') return
    const x = Math.max(0, Math.floor(ev.fine?.x ?? ev.x))
    const y = Math.floor(ev.fine?.y ?? ev.y)
    if (y < 0 || y >= p.rows.length) return
    if (ev.type === 'down') {
      if (x < gw) return void s.post({ gutter: { line: p.rows[y].line } }) // 말구름 열기
      if (p.rows[y].note) return
      s.setState({ a: [y, x], b: [y, x] })
    } else if (ev.type === 'move' && cur.a) {
      s.setState({ ...cur, b: [y, x] })
    } else if (ev.type === 'up' && cur.a) {
      s.post({ sel: span(p.rows, cur.a, [y, x], gw) })
      s.setState({ a: null, b: null })
    }
  })

  const sel = s.state?.a && s.state.b ? span(p.rows, s.state.a, s.state.b, gw) : null
  const out = p.rows.map(r => {
    if (r.note) return (
      <Box flexDirection="row">
        <Text>{' '.repeat(p.nw + MW + 1)}</Text><Text dimColor>{'│'}</Text>
        {r.caret ? <Text color="#000000" backgroundColor={COLOR.caret}>{'^'}</Text> : null}
        <Text color="#b39ddb">{r.caret ? r.t.slice(1) : r.t}</Text>
      </Box>
    )
    const on = p.marks.filter(m => m.line === r.line)
    const glyphs: unknown[] = []
    let used = 0
    if (r.first) {
      // 같은 종류는 한 칸에 모으고 개수를 붙인다 (★5). 말구름은 번호가 달라서 따로.
      const items: { kind: string; g: string }[] = []
      // 끼워넣기(^)가 맨 앞. 칸(4)이 차면 나머지는 안 보여도 됨 (본문 색으로 보임)
      for (const m of [...on].sort((a, b) => Number(b.kind === 'caret') - Number(a.kind === 'caret'))) {
        if (m.kind === 'cloud') items.push({ kind: m.kind, g: `(${m.n ?? ''})` })
        else if (!items.some(x => x.kind === m.kind)) {
          const k = on.filter(x => x.kind === m.kind).reduce((s, x) => s + (x.kind === 'good' ? x.n ?? 1 : 1), 0)
          items.push({ kind: m.kind, g: GLYPH[m.kind] + (k > 1 ? String(k) : '') })
        }
      }
      for (const { kind, g } of items) {
        if (!g || used + cols(g) > MW) continue
        used += cols(g)
        glyphs.push(kind === 'good'
          ? <Text color={COLOR.good} backgroundColor="#000000">{g}</Text>
          : kind === 'caret'
            ? <Text color="#000000" backgroundColor={COLOR.caret}>{g}</Text>
            : <Text color={COLOR[kind] ?? 'warning'}>{g}</Text>)
      }
    }
    // 글자마다 모양을 정해 같은 모양끼리 한 덩어리로 (Text 가 너무 많아지지 않게)
    const chars = [...r.t]
    const style = (i: number) => {
      const g = r.off + i
      const hit = on.filter(m => m.c0 <= g && g < m.c1)
      const st: Record<string, string | boolean> = {} // 값 없는 속성은 아예 빼서 넘긴다
      for (const m of hit) st.color = COLOR[m.kind] ?? st.color
      if (hit.some(m => m.kind === 'strike')) st.strikethrough = true
      if (hit.some(m => m.kind === 'good' || m.kind === 'caret' || m.kind === 'cloud')) st.underline = true
      if (sel && sel.line === r.line && sel.c0 <= g && g < sel.c1) st.inverse = true
      return st
    }
    const runs: { t: string; st: ReturnType<typeof style> }[] = []
    chars.forEach((c, i) => {
      const st = style(i)
      const last = runs[runs.length - 1]
      if (last && JSON.stringify(last.st) === JSON.stringify(st)) last.t += c
      else runs.push({ t: c, st })
    })
    return (
      <Box flexDirection="row">
        <Text dimColor>{(r.first ? String(r.line) : '').padStart(p.nw) + ' '}</Text>
        {glyphs as never}
        <Text>{' '.repeat(MW - used)}</Text>
        <Text dimColor>{'│'}</Text>
        {runs.map(x => <Text {...x.st}>{x.t}</Text>)}
      </Box>
    )
  })
  return <Box flexDirection="column">{out}</Box>
}

export default Viewer
