import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'lab-panel',
  component: 'Pane',
  requestId: 'lab-panel',
  props: { title: 'my-project', isFocused: true, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

const fsList = (path: string) =>
  !path.includes('sales-report') ? [{ name: 'sales-report', kind: 'dir' }, { name: 'README.md', kind: 'file' }] : []

// Tree: an edited file inside a collapsed folder lights the folder; a read file lights its own row with an icon.
test('tree shows activity colors and icons', async ($, on) => {
  const now = Date.now()
  const seed: Record<string, unknown> = {
    tab: 'tree',
    touches: [{ path: 'sales-report/a.py', kind: 'edit', at: now }, { path: 'README.md', kind: 'read', at: now }],
  }
  on('state.get', (_, e, next) => (e.key in seed ? { value: { value: seed[e.key], version: 1 } } : next(e)))
  on('session.root', () => ({ value: 'C:/proj' }))
  on('fs.list', (_, e) => ({ value: fsList(e.path) }))
  on('fs.read', (_, e) => {
    if (e.path.endsWith('tabs.json')) return { value: '[]' }
    throw new Error('none')
  })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const dir = JSON.stringify((await ui.find({ key: 'f:sales-report' }))?.children)
  const md = JSON.stringify((await ui.find({ key: 'f:README.md' }))?.children)
  expect(dir).toContain('#FF9640')
  expect(dir).toContain('')
  expect(md).toContain('#C3A6FF')
  expect(md).toContain('')
  await ui.unmount()
})

// Replay: shows step 1/2 with the diff, ▶ moves to step 2.
test('replay tab steps through edits', async ($, on) => {
  const seed: Record<string, unknown> = {
    tab: 'replay',
    steps: [
      { path: 'a.md', tool: 'Edit', before: 'x', after: 'y' },
      { path: 'b.py', tool: 'Write', before: '', after: 'one\ntwo' },
    ],
  }
  on('state.get', (_, e, next) => (e.key in seed ? { value: { value: seed[e.key], version: 1 } } : next(e)))
  on('fs.read', (_, e) => {
    if (e.path.endsWith('tabs.json')) return { value: '[]' }
    throw new Error('none')
  })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(JSON.stringify(await ui.find({ key: 'rp:nav' }))).toContain('1/2')
  expect(await ui.find({ type: 'Text', text: /^- x$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^\+ y$/ })).toBeDefined()
  await $.ui.press({ plugin: 'lab-panel', key: 'rp:next' })
  expect(JSON.stringify(await ui.find({ key: 'rp:nav' }))).toContain('2/2')
  expect(await ui.find({ type: 'Text', text: /^\+ two$/ })).toBeDefined()
  await ui.unmount()
})
