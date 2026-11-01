import { expect, test } from 'claude-code/testing'

import { encodePng1bit, rasterStrokes } from './png'

// Independent bitwise CRC-32 reference
function refCrc(bytes: number[]): number {
  let c = 0xffffffff
  for (const b of bytes) {
    c ^= b
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return (c ^ 0xffffffff) >>> 0
}
const be32 = (a: Uint8Array, o: number) => ((a[o] << 24) | (a[o + 1] << 16) | (a[o + 2] << 8) | a[o + 3]) >>> 0

test('PNG signature, IHDR fields and CRC', () => {
  const png = encodePng1bit(new Uint8Array(10 * 3), 10, 3)
  expect(Array.from(png.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  expect(be32(png, 8)).toBe(13)
  expect(String.fromCharCode(...png.subarray(12, 16))).toBe('IHDR')
  expect(be32(png, 16)).toBe(10)
  expect(be32(png, 20)).toBe(3)
  expect(Array.from(png.subarray(24, 29))).toEqual([1, 3, 0, 0, 0])
  expect(be32(png, 29)).toBe(refCrc(Array.from(png.subarray(12, 29))))
  expect(refCrc([73, 69, 78, 68])).toBe(0xae426082) // known IEND CRC
})

test('stored deflate blocks are well formed', () => {
  const w = 1280, h = 800
  const png = encodePng1bit(new Uint8Array(w * h), w, h)
  // signature 8 + IHDR 25 + PLTE 18 = 51; IDAT length(4) type(4) data
  const idatLen = be32(png, 51)
  expect(String.fromCharCode(...png.subarray(55, 59))).toBe('IDAT')
  let o = 59 + 2 // skip zlib header
  const rawLen = h * (1 + w / 8)
  let total = 0
  for (;;) {
    const final = png[o], len = png[o + 1] | (png[o + 2] << 8), nlen = png[o + 3] | (png[o + 4] << 8)
    expect(len).toBeLessThanOrEqual(65535)
    expect(nlen).toBe(~len & 0xffff)
    total += len
    o += 5 + len
    if (final) break
  }
  expect(total).toBe(rawLen)
  expect(o + 4 - 59).toBe(idatLen)
})

test('a stroke sets the expected pixels', () => {
  const bits = rasterStrokes([[[2, 1]], [[0, 0], [1, 0]]], 4, 2, 40, 20)
  expect(bits.length).toBe(800)
  expect(bits[(15) * 40 + 25]).toBe(1) // centre of cell (2,1): (25, 15)
  expect(bits[19 * 40 + 39]).toBe(0) // far corner stays white
  expect(bits[5 * 40 + 10]).toBe(1) // between the two points of stroke 2
})

test('set bit lands in the packed row', () => {
  const bits = new Uint8Array(9 * 2)
  bits[1 * 9 + 8] = 1 // row 1, x = 8 -> second byte, top bit
  const png = encodePng1bit(bits, 9, 2)
  // IDAT data starts at 59; zlib header 2 + block header 5; row0 = 1+2 bytes, row1 = filter + 2 bytes
  expect(png[59 + 2 + 5 + 3 + 1 + 1]).toBe(0x80)
})
