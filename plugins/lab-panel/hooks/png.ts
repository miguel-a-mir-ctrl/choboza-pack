// Pure PNG helpers (no runtime APIs): draw strokes into a 1-bit bitmap and encode it as an uncompressed PNG.

// Bitmap: one byte per pixel, 0 = white paper, 1 = magenta stroke.
// Same look as sketch-save.ps1: point = (x+0.5)*scale, pen width max(3, min(sx,sy)*0.9), round caps and joins.
export function rasterStrokes(strokes: number[][][], gridW: number, gridH: number, outW: number, outH: number): Uint8Array {
  const bits = new Uint8Array(outW * outH)
  const sx = outW / gridW, sy = outH / gridH
  const r = Math.max(3, Math.min(sx, sy) * 0.9) / 2
  const stamp = (cx: number, cy: number) => {
    for (let y = Math.max(0, Math.ceil(cy - r)); y <= Math.min(outH - 1, Math.floor(cy + r)); y++) {
      for (let x = Math.max(0, Math.ceil(cx - r)); x <= Math.min(outW - 1, Math.floor(cx + r)); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) bits[y * outW + x] = 1
      }
    }
  }
  const step = Math.max(1, r / 2)
  for (const s of strokes) {
    const pts = s.map(p => [(p[0] + 0.5) * sx, (p[1] + 0.5) * sy])
    if (pts.length === 1) stamp(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step))
      for (let k = 0; k <= n; k++) stamp(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n)
    }
  }
  return bits
}

let CRC_TABLE: Uint32Array | null = null
export function crc32(data: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      CRC_TABLE[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (const b of data) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function adler32(data: Uint8Array): number {
  let a = 1, b = 0
  for (const x of data) { a = (a + x) % 65521; b = (b + a) % 65521 }
  return ((b << 16) | a) >>> 0
}

const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]

function chunk(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + body.length)
  out.set(u32(body.length), 0)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(body, 8)
  out.set(u32(crc32(out.subarray(4, 8 + body.length))), 8 + body.length)
  return out
}

// bits: one byte per pixel (0 = white, 1 = magenta), row-major. Output: palette PNG, 1 bit per pixel, stored deflate blocks.
export function encodePng1bit(bits: Uint8Array, w: number, h: number): Uint8Array {
  const rowBytes = Math.ceil(w / 8)
  const raw = new Uint8Array(h * (1 + rowBytes)) // filter byte 0 + packed row
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (bits[y * w + x]) raw[y * (1 + rowBytes) + 1 + (x >> 3)] |= 0x80 >> (x & 7)
  }
  const blocks = Math.max(1, Math.ceil(raw.length / 65535))
  const z = new Uint8Array(2 + raw.length + blocks * 5 + 4)
  z[0] = 0x78; z[1] = 0x01
  let o = 2
  for (let i = 0; i < blocks; i++) {
    const part = raw.subarray(i * 65535, (i + 1) * 65535)
    const len = part.length
    z.set([i === blocks - 1 ? 1 : 0, len & 255, len >> 8, ~len & 255, (~len >> 8) & 255], o)
    z.set(part, o + 5)
    o += 5 + len
  }
  z.set(u32(adler32(raw)), o)
  const parts = [
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', Uint8Array.from([...u32(w), ...u32(h), 1, 3, 0, 0, 0])),
    chunk('PLTE', Uint8Array.from([255, 255, 255, 255, 0, 255])),
    chunk('IDAT', z),
    chunk('IEND', new Uint8Array(0)),
  ]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let p = 0
  for (const part of parts) { out.set(part, p); p += part.length }
  return out
}
