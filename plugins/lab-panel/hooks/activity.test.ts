import { expect, test } from 'claude-code/testing'

import { addTouch, cellsOf, diffOf, FADE_MS, fitCells, heatOf, iconOf, setIcons, setRoot, stepOf, toRel, touchOf } from './activity'

setRoot('C:/proj')

test('paths: windows, git bash and outside the root', () => {
  expect(toRel('C:\\proj\\sales-report\\a.py')).toBe('sales-report/a.py')
  expect(toRel('c:/PROJ/README.md')).toBe('README.md')
  expect(toRel('/c/proj/x/y.md')).toBe('x/y.md')
  expect(toRel('C:/other/a.py')).toBe(null)
  expect(toRel('C:/proj-old/a.py')).toBe(null)
})

test('touch kinds per tool', () => {
  expect(touchOf('Read', { file_path: 'C:/proj/a.md' })).toEqual({ path: 'a.md', kind: 'read' })
  expect(touchOf('Edit', { file_path: 'C:/proj/a.md' })).toEqual({ path: 'a.md', kind: 'edit' })
  expect(touchOf('Grep', { pattern: 'x' })).toBe(null)
  expect(touchOf('Bash', { command: 'cat a.md' })).toBe(null)
})

test('heat: own row, collapsed folder, edit not downgraded, fades', () => {
  let list = addTouch([], { path: 'sales-report/a.py', kind: 'edit', at: 1000 })
  list = addTouch(list, { path: 'sales-report/a.py', kind: 'read', at: 2000 })
  expect(list.length).toBe(1)
  expect(heatOf(list, 'sales-report/a.py', false, 2500)).toEqual({ kind: 'edit', hot: true })
  expect(heatOf(list, 'sales-report', true, 2500)?.kind).toBe('edit')
  expect(heatOf(list, 'sales-report', false, 2500)).toBe(null) // expanded folder: the file row shows it
  expect(heatOf(list, 'sales', true, 2500)).toBe(null) // prefix of a name is not a parent
  expect(heatOf(list, 'sales-report/a.py', false, 2000 + FADE_MS)).toBe(null)
})

test('icons', () => {
  expect(iconOf('a.py', false, false)).toBe('\ue73c')
  expect(iconOf('x', true, true)).toBe('\uf07c')
  expect(iconOf('noext', false, false)).toBe('\uf15b')
  setIcons('plain')
  expect([iconOf('a.py', false, false), iconOf('x', true, true), iconOf('x', true, false)]).toEqual(['-', 'v', '>'])
  setIcons('nerd')
})

test('replay step and short diff', () => {
  const s = stepOf('Edit', { file_path: 'C:/proj/a.md', old_string: 'a\nb\nc', new_string: 'a\nB\nc\nd' }, null)
  expect(s?.path).toBe('a.md')
  const d = diffOf(s!.before, s!.after)
  expect([d.removed, d.added]).toEqual([1, 2])
  expect(d.lines.map(l => l.sign + l.text)).toEqual(['-b', '+B', '+d'])
  expect(diffOf('', 'x\ny').added).toBe(2)
  expect(stepOf('Edit', { file_path: 'D:/other/a.md', old_string: 'a', new_string: 'b' }, null)).toBe(null)
})

test('cells and fit: Hangul is 2 cells, long names get an ellipsis', () => {
  expect(cellsOf('ab가')).toBe(4)
  expect(fitCells('short', 10)).toBe('short')
  expect(fitCells('abcdefghij', 6)).toBe('abcde…')
  expect(cellsOf(fitCells('가나다라마바', 7))).toBeLessThan(8)
})
