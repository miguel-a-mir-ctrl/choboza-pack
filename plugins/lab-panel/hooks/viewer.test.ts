import { expect, test } from 'claude-code/testing'
import { charAt, span } from './viewer'
import { addMark } from './register'

const mk = (kind: string, c0: number, c1: number) => ({ id: `${kind}${c0}`, line: 1, c0, c1, kind, head: '' })

test('잘함 겹치면 범위 합치고 별 +1, 안 겹치면 따로', () => {
  let m = addMark([], mk('good', 2, 6), 'GPU: Intel')
  m = addMark(m, mk('good', 4, 9), 'GPU: Intel')
  expect(m).toMatchObject([{ c0: 2, c1: 9, n: 2 }])
  expect(addMark(m, mk('good', 0, 1), 'GPU: Intel')).toHaveLength(2)
})

test('취소선: 겹치거나 공백만 사이면 이어 붙임 (개수 그대로), 글자 사이면 따로', () => {
  let m = addMark([], mk('strike', 0, 3), 'abc def ghi')
  m = addMark(m, mk('strike', 4, 7), 'abc def ghi') // 사이가 공백
  m = addMark(m, mk('strike', 1, 2), 'abc def ghi') // 겹침
  expect(m).toMatchObject([{ c0: 0, c1: 7 }])
  expect(m).toHaveLength(1)
  expect(addMark(m, mk('strike', 9, 11), 'abc def ghi')).toHaveLength(2) // 'g' 가 사이에
})

const rows = [{ line: 3, off: 10, t: '가나다abc', first: true }]

test('칸 → 글자 번호 (한글 2칸)', () => {
  expect(charAt('가나다abc', 0)).toBe(0)
  expect(charAt('가나다abc', 1)).toBe(0)
  expect(charAt('가나다abc', 2)).toBe(1)
  expect(charAt('가나다abc', 6)).toBe(3)
  expect(charAt('가나다abc', 99)).toBe(6)
})

test('끌기 범위는 줄 안 [시작,끝) 글자, 줄 번호·바깥 위치 반영', () => {
  expect(span(rows, [0, 5], [0, 8], 5)).toEqual({ line: 3, c0: 10, c1: 12 }) // 칸 0~3 = 가·나
  expect(span(rows, [0, 5], [0, 5], 5)).toEqual({ line: 3, c0: 10, c1: 11 }) // 한 번 클릭 = 한 글자
})
