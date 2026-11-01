// One note tab: a row of <tabsDir>/tabs.json, its content in <id>.md
export type PanelTab = { id: string; title: string }
// 그림판: base = 원본 PNG 경로, px = 줄인 그림의 줄마다 'rrggbb' 이어 붙인 글자
export type PanelCanvas = { base: string; w: number; h: number; px: string[] }

// 글 보기 표시 하나: line 은 1부터, c0~c1 은 그 줄(탭은 공백 2칸으로 편 글) 안 글자 번호. head 는 줄 앞 20자(줄이 밀렸는지 확인용)
// n: 잘함을 겹쳐 누른 횟수 (별 개수 = 얼마나 잘했나)
export type PanelMark = { id: string; line: number; c0: number; c1: number; kind: string; head: string; text?: string; n?: number }
// 입력칸이 열린 표시 (id 가 있으면 고치는 중)
export type PanelEdit = { id?: string; line: number; c0: number; c1: number; kind: string; text: string }

// File activity in the tree: newest first, one per path (path relative to the project root, '/').
export type PanelTouch = { path: string; kind: 'read' | 'edit'; at: number }
// One edit for the replay tab: text before/after (Edit = old/new string, Write = whole file).
export type PanelStep = { path: string; tool: string; before: string; after: string }
// New-activity dots on tab buttons while another tab is shown.
export type PanelDots = { tree: boolean; replay: boolean }

// tab: 지금 보는 탭 ('tree' 또는 내 탭 id). expanded: 펼친 폴더 (relative to the project root). tick: 다시 그리기용.
declare module 'claude-code' {
  interface PluginState {
    'lab-panel': { tab: string; expanded: string[]; adding: boolean; tick: number; canvas: PanelCanvas | null; strokes: number[][][]; clear: number; offsets: Record<string, number>; open: string; view: 'memo' | 'file'; tool: string; edit: PanelEdit | null; draft: string; del: string; wide: boolean; touches: PanelTouch[]; steps: PanelStep[]; pending: PanelStep[]; rstep: number; dots: PanelDots }
  }
}
