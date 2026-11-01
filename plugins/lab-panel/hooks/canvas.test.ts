import { expect, test } from 'claude-code/testing'

import { complement, line, runs } from './canvas'

test('같은 색 칸은 한 덩어리로 묶음', () => {
  const colors = ['a', 'a', 'b', 'b', 'b', 'a']
  expect(runs(6, c => [colors[c], 'x'])).toEqual([['a', 'x', 2], ['b', 'x', 3], ['a', 'x', 1]])
})

test('펜 색은 밑 픽셀의 보색', () => {
  expect(complement('ffffff')).toBe('000000')
  expect(complement('ff00ff')).toBe('00ff00')
})

test('빠르게 그어도 두 점 사이가 끊기지 않음', () => {
  const pts = line([0, 0], [4, 2])
  expect(pts[0]).toEqual([0, 0])
  expect(pts[pts.length - 1]).toEqual([4, 2])
  for (let i = 1; i < pts.length; i++) {
    expect(Math.abs(pts[i][0] - pts[i - 1][0]) <= 1 && Math.abs(pts[i][1] - pts[i - 1][1]) <= 1).toBe(true)
  }
})
