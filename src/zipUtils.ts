interface ZipEntry {
  name: string
  blob: Blob
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

export const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const dosDateTime = (d = new Date()) => {
  const time =
    (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2)
  const date =
    ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  return { time: time & 0xffff, date: date & 0xffff }
}

const buildLocalHeader = (name: string, crc: number, size: number) => {
  const nameBytes = new TextEncoder().encode(name)
  const { time, date } = dosDateTime()
  const header = new Uint8Array(30 + nameBytes.length)
  const dv = new DataView(header.buffer)
  dv.setUint32(0, 0x04034b50, true) // local file header signature
  dv.setUint16(4, 20, true) // version needed
  dv.setUint16(6, 0x0800, true) // UTF-8 filename flag
  dv.setUint16(8, 0, true) // store (no compression)
  dv.setUint16(10, time, true)
  dv.setUint16(12, date, true)
  dv.setUint32(14, crc, true)
  dv.setUint32(18, size, true) // compressed size
  dv.setUint32(22, size, true) // uncompressed size
  dv.setUint16(26, nameBytes.length, true)
  dv.setUint16(28, 0, true) // extra field length
  header.set(nameBytes, 30)
  return header
}

const buildCentralEntry = (
  name: string,
  crc: number,
  size: number,
  offset: number,
) => {
  const nameBytes = new TextEncoder().encode(name)
  const { time, date } = dosDateTime()
  const entry = new Uint8Array(46 + nameBytes.length)
  const dv = new DataView(entry.buffer)
  dv.setUint32(0, 0x02014b50, true) // central directory signature
  dv.setUint16(4, 20, true) // version made by
  dv.setUint16(6, 20, true) // version needed
  dv.setUint16(8, 0x0800, true) // UTF-8 filename flag
  dv.setUint16(10, 0, true) // store
  dv.setUint16(12, time, true)
  dv.setUint16(14, date, true)
  dv.setUint32(16, crc, true)
  dv.setUint32(20, size, true) // compressed size
  dv.setUint32(24, size, true) // uncompressed size
  dv.setUint16(28, nameBytes.length, true)
  dv.setUint16(30, 0, true) // extra field length
  dv.setUint16(32, 0, true) // comment length
  dv.setUint16(34, 0, true) // disk number start
  dv.setUint16(36, 0, true) // internal attributes
  dv.setUint32(38, 0, true) // external attributes
  dv.setUint32(42, offset, true) // local header offset
  entry.set(nameBytes, 46)
  return entry
}

const buildEocd = (count: number, cdSize: number, cdOffset: number) => {
  const b = new Uint8Array(22)
  const dv = new DataView(b.buffer)
  dv.setUint32(0, 0x06054b50, true) // end of central directory signature
  dv.setUint16(4, 0, true) // disk number
  dv.setUint16(6, 0, true) // disk with central directory
  dv.setUint16(8, count, true) // entries on this disk
  dv.setUint16(10, count, true) // total entries
  dv.setUint32(12, cdSize, true)
  dv.setUint32(16, cdOffset, true)
  dv.setUint16(20, 0, true) // comment length
  return b
}

export const supportsStreamingZip = () =>
  typeof (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker === 'function'

export const streamZipToDisk = async (
  entries: ZipEntry[],
  suggestedName: string,
): Promise<void> => {
  const picker = (
    window as unknown as {
      showSaveFilePicker: (options: {
        suggestedName: string
        types: { description: string; accept: Record<string, string[]> }[]
      }) => Promise<{
        createWritable: () => Promise<{
          write: (chunk: Blob | Uint8Array | ArrayBuffer) => Promise<void>
          close: () => Promise<void>
        }>
      }>
    }
  ).showSaveFilePicker

  const handle = await picker({
    suggestedName,
    types: [
      { description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } },
    ],
  })
  const writable = await handle.createWritable()

  let offset = 0
  const central: { name: string; crc: number; size: number; offset: number }[] = []

  for (const { name, blob } of entries) {
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const crc = crc32(bytes)
    const local = buildLocalHeader(name, crc, bytes.length)
    await writable.write(local)
    await writable.write(bytes)
    central.push({ name, crc, size: bytes.length, offset })
    offset += local.length + bytes.length
  }

  const cdOffset = offset
  let cdSize = 0
  for (const e of central) {
    const entry = buildCentralEntry(e.name, e.crc, e.size, e.offset)
    await writable.write(entry)
    cdSize += entry.length
  }

  await writable.write(buildEocd(central.length, cdSize, cdOffset))
  await writable.close()
}