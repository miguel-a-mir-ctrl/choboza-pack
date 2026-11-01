import type { EngineInterface } from 'claude-code'

import type { Sys } from '../types'

// CPU/RAM/GPU/NPU sampling for Linux and macOS. Windows uses the PowerShell script in register.tsx.
export const GPU_OPTS = ['auto', 'nvidia', 'amd', 'intel', 'off'] as const
export type GpuOpt = (typeof GPU_OPTS)[number]
export const asGpuOpt = (v: unknown): GpuOpt => GPU_OPTS.find(o => o === v) ?? 'auto'

type Vendor = 'amd' | 'nvidia' | 'intel'
export type GpuReading = { vendor: Vendor; pct: number; approx?: boolean }
export type CpuTimes = { idle: number; total: number }

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
const orNeg = (n: number) => (Number.isNaN(n) ? -1 : clamp(n))
const gb = (bytes: number) => Math.round((bytes / 1073741824) * 10) / 10
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

export function parseCpuStat(text: string): CpuTimes | null {
  const m = /^cpu\s+(.+)$/m.exec(text)
  if (!m) return null
  const v = m[1].trim().split(/\s+/).map(Number)
  if (v.length < 4 || v.some(Number.isNaN)) return null
  // idle + iowait are idle; guest columns are already inside user/nice, so only the first 8 count
  return { idle: v[3] + (v[4] ?? 0), total: sum(v.slice(0, 8)) }
}

export function cpuPct(a: CpuTimes, b: CpuTimes): number {
  const dt = b.total - a.total
  return dt > 0 ? clamp(100 * (1 - (b.idle - a.idle) / dt)) : -1
}

export function parseMeminfo(text: string): { ram: number; ramGb: number } | null {
  const kb = (k: string) => Number(new RegExp(`^${k}:\\s+(\\d+)`, 'm').exec(text)?.[1] ?? NaN)
  const total = kb('MemTotal')
  const avail = kb('MemAvailable')
  if (!(total > 0) || Number.isNaN(avail)) return null
  return { ram: clamp(100 * (1 - avail / total)), ramGb: gb((total - avail) * 1024) }
}

// one number from a sysfs file; NaN when unreadable
export const parseNum = (text: string) => Number.parseFloat(text.trim())

// nvidia-smi csv,noheader,nounits: one utilization per GPU per line; "[N/A]" lines are skipped
export function parseNvidia(out: string): number {
  const v = out.split('\n').map(l => Number.parseFloat(l.trim())).filter(n => !Number.isNaN(n))
  return v.length ? clamp(Math.max(...v)) : -1
}

// Intel iGPU has no busy counter without root: the frequency position between min and max stands in for it
export function intelPct(act: number, rpn: number, rp0: number): number {
  if ([act, rpn, rp0].some(n => Number.isNaN(n)) || rp0 <= rpn) return -1
  return clamp((100 * (act - rpn)) / (rp0 - rpn))
}

export function parseMacCpu(out: string): number {
  const all = [...out.matchAll(/CPU usage:.*?([\d.]+)%\s*idle/g)]
  return all.length ? orNeg(100 - Number(all[all.length - 1][1])) : -1
}

export function parseVmStat(vm: string, memsize: number): { ram: number; ramGb: number } | null {
  const ps = Number(/page size of (\d+) bytes/.exec(vm)?.[1] ?? NaN)
  const pages = (k: string) => Number(new RegExp(`^${k}:\\s+(\\d+)`, 'm').exec(vm)?.[1] ?? NaN)
  const used = (pages('Pages active') + pages('Pages wired down') + pages('Pages occupied by compressor')) * ps
  if (!(memsize > 0) || Number.isNaN(used)) return null
  return { ram: clamp((100 * used) / memsize), ramGb: gb(used) }
}

export function parseIoreg(out: string): number {
  const v = [...out.matchAll(/"Device Utilization %"\s*=\s*(\d+)/g)].map(m => Number(m[1]))
  return v.length ? clamp(Math.max(...v)) : -1
}

// auto = busiest GPU found; a vendor name = only that vendor; off = none
export function pickGpu(list: GpuReading[], opt: GpuOpt): { gpu: number; approx: boolean } {
  const ok = opt === 'off' ? [] : list.filter(g => g.pct >= 0 && (opt === 'auto' || g.vendor === opt))
  const best = ok.reduce<GpuReading | null>((b, g) => (!b || g.pct > b.pct ? g : b), null)
  return best ? { gpu: best.pct, approx: !!best.approx } : { gpu: -1, approx: false }
}

const VENDOR: Record<string, Vendor> = { '0x1002': 'amd', '0x10de': 'nvidia', '0x8086': 'intel' }
const DRM = '/sys/class/drm'
const ACCEL = '/sys/class/accel'
const EVERY_MS = 2000

export function startSysmon($: EngineInterface, gpuOpt: GpuOpt, onSample: (s: Sys) => void): void {
  const txt = (p: string) => $.fs.read(p).catch(() => '')
  const num = async (p: string) => parseNum(await txt(p))
  const names = (dir: string, re: RegExp) =>
    $.fs.list(dir).then(l => l.map(e => e.name).filter(n => re.test(n)), () => [] as string[])
  const run = async (argv: string[]) => {
    try {
      const r = await $.process.run(argv, { timeoutMs: 10_000 })
      return r.exitCode === 0 ? r.stdout : ''
    } catch {
      return ''
    }
  }
  const want = (v: Vendor) => gpuOpt === 'auto' || gpuOpt === v

  const linux = () => {
    let prevCpu: CpuTimes | null = null
    let prevNpu: { t: number; us: number } | null = null
    return async () => {
      const cur = parseCpuStat(await txt('/proc/stat'))
      const cpu = cur && prevCpu ? cpuPct(prevCpu, cur) : -1
      prevCpu = cur ?? prevCpu
      const mem = parseMeminfo(await txt('/proc/meminfo'))

      const gpus: GpuReading[] = []
      let nvidia = false
      if (gpuOpt !== 'off') {
        for (const c of await names(DRM, /^card\d+$/)) {
          const dev = `${DRM}/${c}/device`
          const vendor = VENDOR[(await txt(`${dev}/vendor`)).trim().toLowerCase()]
          if (!vendor || !want(vendor)) continue
          if (vendor === 'amd') gpus.push({ vendor, pct: orNeg(await num(`${dev}/gpu_busy_percent`)) })
          else if (vendor === 'nvidia') nvidia = true
          else {
            const gt = `${DRM}/${c}/gt/gt0`
            const xe = `${dev}/tile0/gt0/freq0`
            // candidates: i915 card-level names, i915 per-gt names, xe names
            for (const [a, lo, hi] of [
              [`${DRM}/${c}/gt_act_freq_mhz`, `${DRM}/${c}/gt_RPn_freq_mhz`, `${DRM}/${c}/gt_RP0_freq_mhz`],
              [`${gt}/rps_act_freq_mhz`, `${gt}/rps_RPn_freq_mhz`, `${gt}/rps_RP0_freq_mhz`],
              [`${xe}/act_freq`, `${xe}/min_freq`, `${xe}/max_freq`],
            ]) {
              const pct = intelPct(await num(a), await num(lo), await num(hi))
              if (pct >= 0) {
                gpus.push({ vendor, pct, approx: true })
                break
              }
            }
          }
        }
        if (nvidia) {
          const out = await run(['nvidia-smi', '--query-gpu=utilization.gpu', '--format=csv,noheader,nounits'])
          gpus.push({ vendor: 'nvidia', pct: parseNvidia(out) })
        }
      }
      const g = pickGpu(gpus, gpuOpt)

      // NPU: busy-time counter delta over the real elapsed time
      let npu = -1
      const now = Date.now()
      const reads = await Promise.all((await names(ACCEL, /^accel\d+$/)).map(a => num(`${ACCEL}/${a}/device/npu_busy_time_us`)))
      const us = reads.find(n => !Number.isNaN(n))
      if (us !== undefined) {
        if (prevNpu && now > prevNpu.t) npu = clamp((us - prevNpu.us) / ((now - prevNpu.t) * 10))
        prevNpu = { t: now, us }
      }
      onSample({ cpu, ram: mem?.ram ?? -1, ramGb: mem?.ramGb ?? 0, gpu: g.gpu, gpuApprox: g.approx, npu })
    }
  }

  const mac = () => {
    let memsize = 0
    return async () => {
      if (!memsize) memsize = Number((await run(['sysctl', '-n', 'hw.memsize'])).trim())
      const [top, vm, io] = await Promise.all([
        run(['top', '-l', '2', '-n', '0', '-s', '1']),
        run(['vm_stat']),
        gpuOpt === 'off' ? '' : run(['ioreg', '-r', '-d', '1', '-w', '0', '-c', 'IOAccelerator']),
      ])
      const mem = parseVmStat(vm, memsize)
      // no vendor split on mac: auto/any picks the busiest accelerator
      onSample({ cpu: parseMacCpu(top), ram: mem?.ram ?? -1, ramGb: mem?.ramGb ?? 0, gpu: parseIoreg(io), npu: -1 })
    }
  }

  void (async () => {
    const os = (await run(['uname', '-s'])).trim()
    const sample = os === 'Linux' ? linux() : os === 'Darwin' ? mac() : null
    if (!sample) return
    let busy = false
    const tick = () => {
      if (busy) return // a slow sample must not overlap the next one
      busy = true
      void sample().catch(() => {}).finally(() => { busy = false })
    }
    tick()
    $.clock.every(EVERY_MS, tick)
  })()
}
