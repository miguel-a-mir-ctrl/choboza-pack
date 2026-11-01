import { expect, test } from 'claude-code/testing'
import { DICT, EN, KO, TH, setLang, t, weekday } from './i18n'

test('t picks the language, fills placeholders, falls back to en', () => {
  setLang('en')
  expect(t('win5h')).toBe('5h')
  expect(t('context', { percent: 7 })).toBe('Context 7%')
  setLang('ko')
  expect(t('winWeek')).toBe('주간')
  expect(t('context', { percent: 7 })).toBe('문맥 7%')
  expect(weekday(new Date(2026, 9, 25))).toBe('일')
  setLang('th')
  expect(t('winWeek')).toBe(TH.winWeek)
  setLang('xx-unknown') // detect, never throws
  expect(typeof t('winWeek')).toBe('string')
  setLang('en')
})

test('every KO key exists in EN', () => {
  expect(Object.keys(EN).sort()).toEqual(Object.keys(KO).sort())
})

const placeholders = (s: string) => Array.from(new Set(s.match(/\{\w+\}/g) ?? [])).sort()

test('every language has every KO key, with the same placeholders', () => {
  for (const dict of Object.values(DICT)) {
    for (const key of Object.keys(KO) as (keyof typeof KO)[]) {
      const s = dict?.[key]
      expect(typeof s).toBe('string')
      expect(placeholders(s ?? '')).toEqual(placeholders(KO[key]))
    }
  }
})
