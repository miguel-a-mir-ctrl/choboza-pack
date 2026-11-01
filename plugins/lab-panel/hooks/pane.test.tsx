import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'lab-panel',
  component: 'Pane',
  requestId: 'lab-panel',
  props: { title: 'my-project', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

// 글 보기 화면에서 도구 버튼을 누르면 tool 상태가 바뀌어야 한다
test('도구 버튼을 누르면 tool 이 바뀐다', async ($, on) => {
  // 탭·파일·보기만 씨앗으로 고정, 나머지(tool 등)는 엔진의 진짜 저장소
  const seed: Record<string, unknown> = { tab: 't1', open: 'a.md', view: 'file' }
  on('state.get', (_, e, next) => (e.key in seed ? { value: { value: seed[e.key], version: 1 } } : next(e)))
  on('fs.read', (_, e) => {
    if (e.path.endsWith('tabs.json')) return { value: JSON.stringify([{ id: 't1', title: '내 탭' }]) }
    if (e.path.endsWith('a.md')) return { value: '첫 줄\n둘째 줄' }
    throw new Error('없음')
  })
  on('fs.write', () => ({ value: undefined }))

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await $.ui.press({ plugin: 'lab-panel', key: 'tool:ask' })
  expect(JSON.stringify((await ui.find({ key: 'tool:ask' }))?.children)).toContain('"inverse":true') // 다시 그린 화면에서 ? 가 선택됨
  await ui.unmount()
})

// 본문을 끌면 표시가 marks 파일에 저장된다 (Client 키가 viewer:all:0 이어도)
test('끌기 → 표시 저장', async ($, on) => {
  const seed: Record<string, unknown> = { tab: 't1', open: 'a.md', view: 'file', tool: 'bang' }
  on('state.get', (_, e, next) => (e.key in seed ? { value: { value: seed[e.key], version: 1 } } : next(e)))
  const files: Record<string, string> = {}
  on('fs.read', (_, e) => {
    if (e.path in files) return { value: files[e.path] }
    if (e.path.endsWith('tabs.json')) return { value: JSON.stringify([{ id: 't1', title: '내 탭' }]) }
    if (e.path.endsWith('a.md')) return { value: 'abcdef\nghi' }
    throw new Error('없음')
  })
  on('fs.write', (_, e) => { files[e.path] = e.text; return { value: undefined } })
  on('clock.now', () => ({ value: 1 }))

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const gw = 1 + 4 + 2 // 줄 번호 1칸 + 표시 4칸 + 공백·│
  await ui.pointer({ type: 'down', x: gw, y: 0, button: 'left', in: 'viewer:all:0' })
  await ui.pointer({ type: 'up', x: gw + 2, y: 0, button: 'left', in: 'viewer:all:0' })
  const saved = Object.entries(files).find(([p]) => p.includes('marks'))
  expect(saved && JSON.parse(saved[1])).toMatchObject([{ line: 1, c0: 0, c1: 3, kind: 'bang' }])
  await ui.unmount()
})

// 메모 줄이 사라져 줄 배치가 바뀐 뒤에도 끌기가 지금 줄을 쓴다 (옛 표시가 안 지워지던 원인)
test('줄 배치가 바뀐 뒤 끌기', async ($, on) => {
  const seed: Record<string, unknown> = { tab: 't1', open: 'a.md', view: 'file' }
  on('state.get', (_, e, next) => (e.key in seed ? { value: { value: seed[e.key], version: 1 } } : next(e)))
  let marks = JSON.stringify([{ id: 'c', line: 1, c0: 0, c1: 2, kind: 'caret', head: '', text: '메모' }])
  on('fs.read', (_, e) => {
    if (e.path.includes('marks')) return { value: marks }
    if (e.path.endsWith('tabs.json')) return { value: JSON.stringify([{ id: 't1', title: '내 탭' }]) }
    if (e.path.endsWith('a.md')) return { value: 'abcdef\nghi' }
    throw new Error('없음')
  })
  on('fs.write', (_, e) => { if (e.path.includes('marks')) marks = e.text; return { value: undefined } })
  on('clock.now', () => ({ value: 1 }))

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const gw = 1 + 4 + 2
  const drag = async (y: number) => {
    await ui.pointer({ type: 'down', x: gw, y, button: 'left', in: 'viewer:all:0' })
    await ui.pointer({ type: 'up', x: gw, y, button: 'left', in: 'viewer:all:0' })
  }
  await ui.press({ key: 'tool:erase' })
  await drag(0) // 1줄 끼워넣기 지움 → 메모 줄이 없어져 2줄이 한 칸 올라옴
  expect(JSON.parse(marks)).toEqual([])
  await ui.press({ key: 'tool:bang' })
  await drag(1) // 이제 y=1 은 2줄
  expect(JSON.parse(marks)).toMatchObject([{ line: 2, kind: 'bang' }])
  await ui.unmount()
})

// The always-visible [Panel] button above the prompt opens the pane (works mid-turn, unlike /panel)
test('button above the prompt opens the pane', async ($, on) => {
  let opened: any = null
  on('ui.open', (_, e) => { opened = e; return { value: undefined } })
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e); return <Text>below</Text> })
  const ui = await $.ui.mount({ plugin: 'lab-panel', component: 'AbovePrompt', props: { bodyColumns: 80, hasSurvey: false }, surface: 'terminal' } as any)
  expect((await ui.find({ type: 'Text', text: /\[.+\]/ }))?.text).toBeTruthy()
  await $.ui.press({ plugin: 'lab-panel', key: 'open-panel' })
  await new Promise(r => setTimeout(r, 50))
  expect(opened?.id).toBe('lab-panel')
  await ui.unmount()
})
