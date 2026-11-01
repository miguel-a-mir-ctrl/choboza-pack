import { expect, test } from 'claude-code/testing'

import {
  asGpuOpt, cpuPct, intelPct, parseCpuStat, parseIoreg, parseMacCpu, parseMeminfo, parseNum, parseNvidia, parseVmStat, pickGpu,
} from './sysmon'

test('linux cpu: delta of idle+iowait against total', () => {
  const a = parseCpuStat('cpu  100 0 100 700 100 0 0 0 0 0\ncpu0 1 1 1 1 1 0 0 0 0 0\n')
  const b = parseCpuStat('cpu  200 0 200 750 150 0 0 0 0 0\n')
  expect(a).toEqual({ idle: 800, total: 1000 })
  expect(cpuPct(a!, b!)).toBe(67) // 100 idle of 300 total
  expect(cpuPct(a!, a!)).toBe(-1)
  expect(parseCpuStat('nothing')).toBe(null)
})

test('linux ram: MemTotal - MemAvailable', () => {
  const m = parseMeminfo('MemTotal:       16777216 kB\nMemFree: 1 kB\nMemAvailable:    8388608 kB\n')
  expect(m).toEqual({ ram: 50, ramGb: 8 })
  expect(parseMeminfo('MemTotal: 1 kB')).toBe(null)
})

test('gpu counters: amd file, nvidia-smi, intel frequency estimate', () => {
  expect(parseNum('37\n')).toBe(37)
  expect(parseNum('')).toBeNaN()
  expect(parseNvidia('12\n63\n')).toBe(63)
  expect(parseNvidia('[N/A]\n')).toBe(-1)
  expect(parseNvidia('')).toBe(-1)
  expect(intelPct(650, 300, 1000)).toBe(50)
  expect(intelPct(100, 300, 1000)).toBe(0) // below the floor clamps to 0
  expect(intelPct(NaN, 300, 1000)).toBe(-1)
  expect(intelPct(500, 1000, 1000)).toBe(-1)
})

test('mac: top, vm_stat, ioreg', () => {
  const top = 'Processes: 400\nCPU usage: 10.0% user, 5.0% sys, 85.0% idle\n\nProcesses: 400\nCPU usage: 20.5% user, 9.5% sys, 70.0% idle\n'
  expect(parseMacCpu(top)).toBe(30)
  expect(parseMacCpu('')).toBe(-1)
  const vm = 'Mach Virtual Memory Statistics: (page size of 16384 bytes)\nPages free: 5.\nPages active: 100000.\nPages wired down: 50000.\nPages occupied by compressor: 10000.\n'
  const mem = parseVmStat(vm, 16 * 1073741824)
  expect(mem?.ramGb).toBe(2.4)
  expect(mem?.ram).toBe(15)
  expect(parseVmStat('junk', 1)).toBe(null)
  expect(parseIoreg('"PerformanceStatistics" = {"Device Utilization %"=12,"x"=1}\n{"Device Utilization %"=47}')).toBe(47)
  expect(parseIoreg('')).toBe(-1)
})

test('gpu option: auto = busiest, vendor = only that one, off = none', () => {
  const list = [
    { vendor: 'intel' as const, pct: 80, approx: true },
    { vendor: 'amd' as const, pct: 30 },
    { vendor: 'nvidia' as const, pct: -1 },
  ]
  expect(pickGpu(list, 'auto')).toEqual({ gpu: 80, approx: true })
  expect(pickGpu(list, 'amd')).toEqual({ gpu: 30, approx: false })
  expect(pickGpu(list, 'nvidia')).toEqual({ gpu: -1, approx: false })
  expect(pickGpu(list, 'off')).toEqual({ gpu: -1, approx: false })
  expect(asGpuOpt('amd')).toBe('amd')
  expect(asGpuOpt("x'; rm")).toBe('auto')
})
