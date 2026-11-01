import { expect, test } from 'claude-code/testing'

import { advise, cells, markView, nextMark, notice, shimmer } from './register'

test('커밋하면 OFF, 고치면 ON, 할 일이 있으면 숫자', () => {
  let m = nextMark(null, 'Bash', 'git status')
  expect(markView(m).text).toBe('● ON')
  m = nextMark(m, 'Bash', 'cd x && git add a && git commit -q -m "고침"')
  expect(markView(m).text).toBe('● OFF')
  m = nextMark(m, 'PowerShell', 'git commit -m @\'\n고침\n\'@')
  expect(markView(m).text).toBe('● OFF')
  m = nextMark(m, 'Edit', '')
  expect(markView(m).text).toBe('● ON')
  m = nextMark(m, 'Bash', ': pending 2')
  expect(markView(m).text).toBe('● 2')
  m = nextMark(m, 'Bash', 'git commit -m x')
  expect(markView(m).text).toBe('● 2') // 할 일이 남으면 커밋해도 숫자
  m = nextMark(m, 'Bash', ': pending 0')
  expect(markView(m).text).toBe('● OFF')
  expect(nextMark(m, 'Read', 'git commit')).toBe(m)
})

test('한글은 2칸, 영어·숫자는 1칸으로 센다', () => {
  expect(cells('CPU 7%')).toBe(6)
  expect(cells('문맥 70%')).toBe(8)
  expect(cells('사용량 · 5시간')).toBe(14)
})

test('문맥 조언: 토큰 수 기준', () => {
  const off = { off: true, pending: 0 }
  const on = { off: false, pending: 0 }
  expect(advise(120_000, off, false).kind).toBe(null)
  expect(advise(160_000, on, false).kind).toBe(null) // task not finished
  expect(advise(160_000, off, false).kind).toBe('new')
  expect(advise(420_000, on, false).kind).toBe('both')
  expect(advise(420_000, { off: true, pending: 2 }, false).kind).toBe('compact')
  expect(advise(110_000, on, true).kind).toBe('new') // came back after idle
  expect(notice(160_000, advise(160_000, off, false))).toContain('new session')
})

test('effort shimmer: one light sweeps high, max cycles rainbow, unknown stays plain', () => {
  const lit = (f: number) => shimmer('high', f).filter(c => c.color === '#B4BEFF').length
  expect(shimmer('high', 0).map(c => c.ch).join('')).toBe('high')
  expect(lit(0)).toBe(1)
  expect(shimmer('high', 0)[0].color).toBe('#B4BEFF')
  expect(shimmer('high', 2)[2].color).toBe('#B4BEFF')
  expect(lit(5)).toBe(0) // resting between sweeps
  expect(shimmer('max', 0)[0].color).not.toBe(shimmer('max', 1)[0].color)
  expect(shimmer('-', 3)).toEqual([{ ch: '-', color: 'inactive' }])
})
