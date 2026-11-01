import { expect, test } from 'claude-code/testing'

const ABOVE = {
  plugin: 'usage-line',
  component: 'AbovePrompt',
  props: { bodyColumns: 200, hasSurvey: false },
} as const

// the stubbed state.set does not trigger a redraw, so the test mounts again after the press
test('the line draws with context advice', async ($, on) => {
  const ver: Record<string, number> = {}
  const v: Record<string, unknown> = {
      info: { model: 'claude-opus-5-5', effort: 'high', tokens: 160000, window: 1000000, percent: 16 },
      mark: { off: true, pending: 0 },
  }
  on('state.get', (_, e: any) => ({ value: { value: v[e.key] ?? null, version: ver[e.key] ?? 0 } }))
  on('state.set', (_, e: any) => {
    v[e.key] = e.value
    ver[e.key] = (ver[e.key] ?? 0) + 1
    return { value: { isSet: true, version: ver[e.key] } }
  })
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e); return <Text>below</Text> })
  const ui = await $.ui.mount({ ...ABOVE, surface: 'terminal' } as any)
  const t = await ui.find({ type: 'Text', text: /새 세션/ })
  expect(t?.text).toContain('새 세션 요망')
  await ui.press({ key: 'ctx' } as any)
  expect(v.act).toMatchObject({ open: true })
  await ui.unmount()
  const ui2 = await $.ui.mount({ ...ABOVE, surface: 'terminal' } as any)
  expect((await ui2.find({ type: 'Text', text: /문맥 조언/ }))?.text).toContain('150k')
  await ui2.unmount()
})
