export type Lang = 'ko' | 'en' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'es' | 'fr' | 'id' | 'th'
const LANGS: Lang[] = ['ko', 'en', 'zh-Hans', 'zh-Hant', 'ja', 'es', 'fr', 'id', 'th']

export const KO = {
  advIdle: '1시간 넘게 쉬었다 옴 + {k} → 컴팩보다 새 세션',
  advBigDone: '{k} ≥ 400k, 커밋까지 끝남 → 새 세션',
  advBigPending: '{k} ≥ 400k, 할 일 {pending}개 남음 → 일 끊기는 곳에서 컴팩',
  advBigBoth: '{k} ≥ 400k → 일 끊기는 곳에서 컴팩이나 새 세션',
  advMidDone: '{k} ≥ 150k, 일 하나 끝남(커밋) → 새 세션',
  advOk: '{k}: 괜찮음 (150k + 일 끝남, 400k, 1시간 쉼 뒤 100k 에서 알림)',
  labelNew: '새 세션 요망',
  labelCompact: '컴팩',
  labelBoth: '컴팩 · 새 세션',
  win5h: '5시간',
  winWeek: '주간',
  usageWait: '사용량 · 첫 응답 뒤에 표시',
  usagePrefix: '사용량 · ',
  resetNote: '(초기화 {reset})',
  context: '문맥 {percent}%',
  adviceTitle: '문맥 조언 · ',
  tapClose: '(다시 누르면 닫힘)',
} as const

export const EN: Record<keyof typeof KO, string> = {
  advIdle: 'Back after 1h+ idle + {k} → new session beats compact',
  advBigDone: '{k} ≥ 400k, committed and done → new session',
  advBigPending: '{k} ≥ 400k, {pending} task(s) left → compact at a break point',
  advBigBoth: '{k} ≥ 400k → compact at a break point, or new session',
  advMidDone: '{k} ≥ 150k, one task done (committed) → new session',
  advOk: '{k}: fine (alerts at 150k + task done, 400k, 100k after a 1h idle)',
  labelNew: 'New session advised',
  labelCompact: 'Compact',
  labelBoth: 'Compact · new session',
  win5h: '5h',
  winWeek: 'Weekly',
  usageWait: 'Usage · shown after the first reply',
  usagePrefix: 'Usage · ',
  resetNote: '(resets {reset})',
  context: 'Context {percent}%',
  adviceTitle: 'Context advice · ',
  tapClose: '(press again to close)',
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
