import type { ClientModule } from 'claude-code'

// 그림은 칸마다 '▀' 하나: 윗 픽셀 = 글자색, 아랫 픽셀 = 배경색. 그래서 한 칸이 픽셀 2개.
type Props = { w: number; h: number; px: string[]; clear: number }
type State = { strokes: number[][][]; clear: number }

const MAX_POINTS = 8000 // post 한 번에 실을 수 있는 크기 안쪽

// 사람 눈에 보이는 펜: 밑 픽셀의 보색이라 어떤 그림 위에서도 보인다
export function complement(hex: string): string {
  return (0xffffff ^ parseInt(hex, 16)).toString(16).padStart(6, '0')
}

// 두 점 사이 픽셀을 잇는다 (빠르게 그어도 선이 끊기지 않게)
export function line(a: number[], b: number[]): number[][] {
  const out: number[][] = []
  let [x, y] = a
  const [x1, y1] = b
  const dx = Math.abs(x1 - x), dy = -Math.abs(y1 - y), sx = x < x1 ? 1 : -1, sy = y < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    out.push([x, y])
    if (x === x1 && y === y1) return out
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x += sx }
    if (e2 <= dx) { err += dx; y += sy }
  }
}

const Canvas: ClientModule<Props, State> = (p, s) => {
  const { Box, Text } = s.elements
  if (!s.state || s.state.clear !== p.clear) {
    // 처음 그릴 때, 또는 '다 지우기'·새 그림을 불러왔을 때
    if (!s.state) {
      s.onPointer(ev => {
        const cur = s.state
        if (!cur) return
        const x = Math.max(0, Math.min(s.columns - 1, Math.floor(ev.fine?.x ?? ev.x)))
        const y = Math.max(0, Math.min(s.rows * 2 - 1, Math.floor((ev.fine?.y ?? ev.y + 0.25) * 2)))
        const count = cur.strokes.reduce((n, st) => n + st.length, 0)
        if (ev.type === 'down' && ev.button === 'right') {
          const strokes = cur.strokes.slice(0, -1) // 오른쪽 클릭 = 한 획 취소
          s.setState({ ...cur, strokes })
          s.post({ strokes })
        } else if (ev.type === 'down' && ev.button === 'left' && count < MAX_POINTS) {
          s.setState({ ...cur, strokes: [...cur.strokes, [[x, y]]] })
        } else if (ev.type === 'move' && ev.button === 'left' && cur.strokes.length && count < MAX_POINTS) {
          const last = cur.strokes[cur.strokes.length - 1]
          const prev = last[last.length - 1]
          if (prev[0] === x && prev[1] === y) return
          const strokes = [...cur.strokes.slice(0, -1), [...last, ...line(prev, [x, y]).slice(1)]]
          s.setState({ ...cur, strokes })
        } else if (ev.type === 'up' && ev.button === 'left') {
          s.post({ strokes: cur.strokes })
        }
      })
    }
    s.setState({ strokes: [], clear: p.clear })
  }

  const pen = new Set((s.state?.strokes ?? []).flat().map(([x, y]) => `${x},${y}`))
  const color = (x: number, y: number) => {
    const row = p.px[Math.min(y, p.h - 1)] ?? ''
    const hex = row.slice(x * 6, x * 6 + 6) || 'ffffff'
    return '#' + (pen.has(`${x},${y}`) ? complement(hex) : hex)
  }
  const rows = []
  for (let r = 0; r < Math.ceil(p.h / 2); r++) {
    rows.push(<Box flexDirection="row">{runs(p.w, c => [color(c, 2 * r), color(c, 2 * r + 1)]).map(
      ([fg, bg, n]) => <Text color={fg} backgroundColor={bg}>{'▀'.repeat(n)}</Text>,
    )}</Box>)
  }
  return <Box flexDirection="column">{rows}</Box>
}

// 같은 색(위, 아래)이 이어지는 칸을 한 덩어리로: 칸마다 Text 를 두면 그림 하나가 크기 제한(10만 글자)을 넘는다
export function runs(w: number, at: (c: number) => string[]): [string, string, number][] {
  const out: [string, string, number][] = []
  for (let c = 0; c < w; c++) {
    const [fg, bg] = at(c)
    const last = out[out.length - 1]
    if (last && last[0] === fg && last[1] === bg) last[2]++
    else out.push([fg, bg, 1])
  }
  return out
}

export default Canvas
