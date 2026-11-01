import { expect, test } from 'claude-code/testing'
import { EN, KO, setLang, t, weekday } from './i18n'

test('t picks the language, fills placeholders, falls back to en', () => {
  setLang('en')
  expect(t('tabTree')).toBe('File tree')
  expect(t('strokesGot', { n: 7 })).toBe('Strokes received: 7')
  setLang('ko')
  expect(t('tabTree')).toBe('폴더 트리')
  expect(t('strokesGot', { n: 7 })).toBe('받은 획 7개')
  expect(weekday(new Date(2026, 9, 25))).toBe('일')
  setLang('th') // no dictionary yet
  expect(t('tabTree')).toBe('File tree')
  setLang('xx-unknown') // detect, never throws
  expect(typeof t('tabTree')).toBe('string')
  setLang('en')
})

test('every KO key exists in EN', () => {
  expect(Object.keys(EN).sort()).toEqual(Object.keys(KO).sort())
})
