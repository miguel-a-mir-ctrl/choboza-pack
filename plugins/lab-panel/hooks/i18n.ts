export type Lang = 'ko' | 'en' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'es' | 'fr' | 'id' | 'th'
const LANGS: Lang[] = ['ko', 'en', 'zh-Hans', 'zh-Hant', 'ja', 'es', 'fr', 'id', 'th']

export const KO = {
  unknownErr: '알 수 없는 오류',
  saveFail: '저장 실패: {err}',
  fillSketch: '이 그림 봐줘 (내가 그린 표시 = 자홍색 #FF00FF 선): {out} ',
  cmdDesc: '패널 열기 (폴더 트리, 그림판, 내 탭)',
  panelOpened: '패널을 열었습니다.',
  btnClipboard: '클립보드 그림',
  btnBlank: '빈 종이',
  btnClear: '다 지우기',
  btnSend: 'Claude 에게 보내기',
  sketchHint: 'Win+Shift+S 로 화면을 캡처한 뒤 "클립보드 그림", 또는 "빈 종이"를 누르세요.',
  sketchDraw: '한 번 클릭 → 왼쪽 버튼으로 끌어 그리기 · 오른쪽 클릭 = 한 획 취소',
  strokesGot: '받은 획 {n}개',
  replayNone1: '아직 고친 파일이 없어요.',
  replayNone2: '제가 파일을 고친 턴이 끝나면 나와요.',
  moreLines: '… {n}줄 더',
  viewMemo: '메모',
  fileUnreadable: '(파일을 읽을 수 없어요)',
  tabEmpty: '아직 비어 있어요. Claude 와 정해서 채웁니다.',
  tabFile: '파일: {path}',
  delSure: '정말 지울까요? 한 번 더 누르면 지움',
  delAsk: '이 탭 지우기 (내용 파일은 남김)',
  toolStrike: '취소선',
  toolGood: '잘함',
  toolCaret: '^넣기',
  toolCloud: '말구름',
  toolErase: '지움',
  inputInsert: '넣을 말',
  submit: '보내기',
  btnSubmit: '[보내기]',
  btnCancel: '[취소]',
  newTabLabel: '새 탭 제목',
  newTabPlaceholder: '예: 오늘 할 일',
  fillNewTab: '패널에 \'{name}\' 탭을 만들었어 ({path}). 여기에 뭘 넣을지 같이 정하자: ',
  tabTree: '폴더 트리',
  tabTreeS: '트리',
  tabSketch: '그림판',
  tabSketchS: '그림',
  tabReplay: '다시 보기',
  tabReplayS: '보기',
} as const

export const EN: Record<keyof typeof KO, string> = {
  unknownErr: 'Unknown error',
  saveFail: 'Save failed: {err}',
  fillSketch: 'Look at this drawing (my marks = magenta #FF00FF lines): {out} ',
  cmdDesc: 'Open the panel (file tree, sketch, my tabs)',
  panelOpened: 'Panel opened.',
  btnClipboard: 'Clipboard image',
  btnBlank: 'Blank paper',
  btnClear: 'Clear all',
  btnSend: 'Send to Claude',
  sketchHint: 'Capture the screen with Win+Shift+S, then press "Clipboard image" or "Blank paper".',
  sketchDraw: 'Click once → drag with the left button to draw · right click = undo one stroke',
  strokesGot: 'Strokes received: {n}',
  replayNone1: 'No edited files yet.',
  replayNone2: 'They appear after a turn where I edit files.',
  moreLines: '… {n} more lines',
  viewMemo: 'Memo',
  fileUnreadable: '(cannot read the file)',
  tabEmpty: 'Still empty. Decide the content with Claude and fill it in.',
  tabFile: 'File: {path}',
  delSure: 'Really delete? Press once more to delete',
  delAsk: 'Delete this tab (the content file is kept)',
  toolStrike: 'Strike',
  toolGood: 'Good',
  toolCaret: '^Insert',
  toolCloud: 'Bubble',
  toolErase: 'Erase',
  inputInsert: 'Text to insert',
  submit: 'Send',
  btnSubmit: '[Send]',
  btnCancel: '[Cancel]',
  newTabLabel: 'New tab title',
  newTabPlaceholder: 'e.g. Today\'s tasks',
  fillNewTab: 'I created a \'{name}\' tab in the panel ({path}). Let\'s decide together what goes in it: ',
  tabTree: 'File tree',
  tabTreeS: 'Tree',
  tabSketch: 'Sketch',
  tabSketchS: 'Draw',
  tabReplay: 'Replay',
  tabReplayS: 'View',
}

export const DICT: Partial<Record<Lang, Partial<Record<keyof typeof KO, string>>>> = { ko: KO, en: EN }

let LANG: Lang = 'en'

function detect(): Lang {
  try {
    const l = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
    if (l.startsWith('ko')) return 'ko'
    if (l.startsWith('ja')) return 'ja'
    if (l === 'zh-tw' || l === 'zh-hk' || l.startsWith('zh-hant')) return 'zh-Hant'
    if (l.startsWith('zh')) return 'zh-Hans'
    if (l.startsWith('es')) return 'es'
    if (l.startsWith('fr')) return 'fr'
    if (l.startsWith('id') || l.startsWith('in')) return 'id'
    if (l.startsWith('th')) return 'th'
  } catch {}
  return 'en'
}

export function setLang(opt: string): void {
  LANG = (LANGS as string[]).includes(opt) ? (opt as Lang) : detect()
}

export function t(key: keyof typeof KO, vars?: Record<string, string | number>): string {
  const s = DICT[LANG]?.[key] ?? EN[key]
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s
}

export function weekday(date: Date): string {
  try {
    return date.toLocaleDateString(LANG, { weekday: 'short' })
  } catch {
    return date.toLocaleDateString('en', { weekday: 'short' })
  }
}
