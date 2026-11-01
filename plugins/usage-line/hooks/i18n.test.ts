import { expect, test } from 'claude-code/testing'
import { EN, KO, setLang, t, weekday } from './i18n'

test('t picks the language, fills placeholders, falls back to en', () => {
  setLang('en')
  expect(t('win5h')).toBe('5h')
  expect(t('context', { percent: 7 })).toBe('Context 7%')
  setLang('ko')
  expect(t('winWeek')).toBe('주간')
  expect(t('context', { percent: 7 })).toBe('문맥 7%')
  expect(weekday(new Date(2026, 9, 25))).toBe('일')
  setLang('th') // no dictionary yet
  expect(t('winWeek')).toBe('Weekly')
  setLang('xx-unknown') // detect, never throws
  expect(typeof t('winWeek')).toBe('string')
  setLang('en')
})

test('every KO key exists in EN', () => {
  expect(Object.keys(EN).sort()).toEqual(Object.keys(KO).sort())
})
