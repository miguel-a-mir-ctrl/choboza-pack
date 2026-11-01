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

export const ZH_HANS: Record<keyof typeof KO, string> = {
  advIdle: '闲置超过1h后回来 + {k} → 新会话比压缩好',
  advBigDone: '{k} ≥ 400k，已提交并完成 → 新会话',
  advBigPending: '{k} ≥ 400k，还剩 {pending} 项任务 → 在任务断开处压缩',
  advBigBoth: '{k} ≥ 400k → 在任务断开处压缩，或新会话',
  advMidDone: '{k} ≥ 150k，完成一项任务(已提交) → 新会话',
  advOk: '{k}: 正常 (150k 且任务完成、400k、闲置1h后 100k 时提醒)',
  labelNew: '建议新会话',
  labelCompact: '压缩',
  labelBoth: '压缩 · 新会话',
  win5h: '5h',
  winWeek: '每周',
  usageWait: '用量 · 第一次回复后显示',
  usagePrefix: '用量 · ',
  resetNote: '(重置于 {reset})',
  context: '上下文 {percent}%',
  adviceTitle: '上下文建议 · ',
  tapClose: '(再按一次关闭)',
}

export const ZH_HANT: Record<keyof typeof KO, string> = {
  advIdle: '閒置超過 1h 後回來 + {k} → 開新對話比壓縮好',
  advBigDone: '{k} ≥ 400k，已提交並完成 → 開新對話',
  advBigPending: '{k} ≥ 400k，還剩 {pending} 項待辦 → 在工作中斷的地方壓縮',
  advBigBoth: '{k} ≥ 400k → 在工作中斷的地方壓縮，或開新對話',
  advMidDone: '{k} ≥ 150k，完成一件事(已提交) → 開新對話',
  advOk: '{k}: 沒問題 (150k 且完成一件事、400k、閒置 1h 後 100k 時提醒)',
  labelNew: '建議開新對話',
  labelCompact: '壓縮',
  labelBoth: '壓縮 · 新對話',
  win5h: '5h',
  winWeek: '每週',
  usageWait: '用量 · 第一次回覆後顯示',
  usagePrefix: '用量 · ',
  resetNote: '(重置 {reset})',
  context: '上下文 {percent}%',
  adviceTitle: '上下文建議 · ',
  tapClose: '(再按一次關閉)',
}

export const JA: Record<keyof typeof KO, string> = {
  advIdle: '1h 以上休んでから戻った + {k} → コンパクトより新しいセッションがおすすめ',
  advBigDone: '{k} ≥ 400k、コミットまで完了 → 新しいセッション',
  advBigPending: '{k} ≥ 400k、残りのタスク {pending}件 → 作業の区切りでコンパクト',
  advBigBoth: '{k} ≥ 400k → 作業の区切りでコンパクト、または新しいセッション',
  advMidDone: '{k} ≥ 150k、タスク1つ完了(コミット済み) → 新しいセッション',
  advOk: '{k}: 問題なし (150k+タスク完了、400k、1h 休んだ後の 100k で通知)',
  labelNew: '新しいセッション推奨',
  labelCompact: 'コンパクト',
  labelBoth: 'コンパクト · 新しいセッション',
  win5h: '5h',
  winWeek: '週間',
  usageWait: '使用量 · 最初の応答の後に表示',
  usagePrefix: '使用量 · ',
  resetNote: '(リセット {reset})',
  context: 'コンテキスト {percent}%',
  adviceTitle: 'コンテキストの助言 · ',
  tapClose: '(もう一度押すと閉じます)',
}

export const ES: Record<keyof typeof KO, string> = {
  advIdle: 'Vuelves tras más de 1h inactivo + {k} → mejor una sesión nueva que compactar',
  advBigDone: '{k} ≥ 400k, confirmado y terminado → sesión nueva',
  advBigPending: '{k} ≥ 400k, quedan {pending} tarea(s) → compactar en un punto de pausa',
  advBigBoth: '{k} ≥ 400k → compactar en un punto de pausa, o sesión nueva',
  advMidDone: '{k} ≥ 150k, una tarea terminada (confirmada) → sesión nueva',
  advOk: '{k}: bien (avisos en 150k + tarea terminada, 400k, 100k tras 1h inactivo)',
  labelNew: 'Se recomienda sesión nueva',
  labelCompact: 'Compactar',
  labelBoth: 'Compactar · sesión nueva',
  win5h: '5h',
  winWeek: 'Semanal',
  usageWait: 'Uso · se muestra tras la primera respuesta',
  usagePrefix: 'Uso · ',
  resetNote: '(se reinicia {reset})',
  context: 'Contexto {percent}%',
  adviceTitle: 'Consejo de contexto · ',
  tapClose: '(pulsa otra vez para cerrar)',
}

export const FR: Record<keyof typeof KO, string> = {
  advIdle: 'Retour après plus de 1h d\'inactivité + {k} → une nouvelle session vaut mieux que compacter',
  advBigDone: '{k} ≥ 400k, commité et terminé → nouvelle session',
  advBigPending: '{k} ≥ 400k, {pending} tâche(s) restante(s) → compacter à un point d\'arrêt',
  advBigBoth: '{k} ≥ 400k → compacter à un point d\'arrêt, ou nouvelle session',
  advMidDone: '{k} ≥ 150k, une tâche finie (commit fait) → nouvelle session',
  advOk: '{k} : ça va (alertes à 150k + tâche finie, 400k, 100k après 1h d\'inactivité)',
  labelNew: 'Nouvelle session conseillée',
  labelCompact: 'Compacter',
  labelBoth: 'Compacter · nouvelle session',
  win5h: '5h',
  winWeek: 'Semaine',
  usageWait: 'Utilisation · affichée après la première réponse',
  usagePrefix: 'Utilisation · ',
  resetNote: '(reset {reset})',
  context: 'Contexte {percent}%',
  adviceTitle: 'Conseil contexte · ',
  tapClose: '(appuyez encore pour fermer)',
}

export const ID: Record<keyof typeof KO, string> = {
  advIdle: 'Kembali setelah diam lebih dari 1h + {k} → sesi baru lebih baik daripada compact',
  advBigDone: '{k} ≥ 400k, sudah di-commit dan selesai → sesi baru',
  advBigPending: '{k} ≥ 400k, sisa {pending} tugas → compact di titik jeda',
  advBigBoth: '{k} ≥ 400k → compact di titik jeda, atau sesi baru',
  advMidDone: '{k} ≥ 150k, satu tugas selesai (sudah di-commit) → sesi baru',
  advOk: '{k}: aman (peringatan di 150k + tugas selesai, 400k, 100k setelah diam 1h)',
  labelNew: 'Disarankan sesi baru',
  labelCompact: 'Compact',
  labelBoth: 'Compact · sesi baru',
  win5h: '5h',
  winWeek: 'Mingguan',
  usageWait: 'Pemakaian · tampil setelah balasan pertama',
  usagePrefix: 'Pemakaian · ',
  resetNote: '(reset {reset})',
  context: 'Konteks {percent}%',
  adviceTitle: 'Saran konteks · ',
  tapClose: '(tekan lagi untuk menutup)',
}

export const TH: Record<keyof typeof KO, string> = {
  advIdle: 'กลับมาหลังทิ้งไว้เกิน 1h + {k} → เปิดเซสชันใหม่ดีกว่า compact',
  advBigDone: '{k} ≥ 400k, commit แล้วและเสร็จแล้ว → เปิดเซสชันใหม่',
  advBigPending: '{k} ≥ 400k, ยังเหลือ {pending} งาน → compact ตรงจุดที่พักได้',
  advBigBoth: '{k} ≥ 400k → compact ตรงจุดที่พักได้ หรือเปิดเซสชันใหม่',
  advMidDone: '{k} ≥ 150k, งานเสร็จ 1 อย่าง (commit แล้ว) → เปิดเซสชันใหม่',
  advOk: '{k}: ปกติ (เตือนที่ 150k + งานเสร็จ, 400k, 100k หลังทิ้งไว้ 1h)',
  labelNew: 'แนะนำเซสชันใหม่',
  labelCompact: 'Compact',
  labelBoth: 'Compact · เซสชันใหม่',
  win5h: '5h',
  winWeek: 'รายสัปดาห์',
  usageWait: 'การใช้งาน · แสดงหลังคำตอบแรก',
  usagePrefix: 'การใช้งาน · ',
  resetNote: '(รีเซ็ต {reset})',
  context: 'บริบท {percent}%',
  adviceTitle: 'คำแนะนำบริบท · ',
  tapClose: '(กดอีกครั้งเพื่อปิด)',
}

export const DICT: Partial<Record<Lang, Partial<Record<keyof typeof KO, string>>>> = {
  ko: KO, en: EN, 'zh-Hans': ZH_HANS, 'zh-Hant': ZH_HANT, ja: JA, es: ES, fr: FR, id: ID, th: TH,
}

let LANG: Lang = 'en'

function detect(): Lang {
  try {
    const l = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
    if (l.startsWith('ko')) return 'ko'
    if (l.startsWith('ja')) return 'ja'
    if (l === 'zh-tw' || l === 'zh-hk' || l === 'zh-mo' || l.startsWith('zh-hant')) return 'zh-Hant'
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
