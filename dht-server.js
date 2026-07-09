const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')
const { Readable } = require('streamx')

const SEED = process.argv[2]
const DATA_SIZE = 10 * 1024 * 1024 * 1024  // 10GB

function fakeStream (totalBytes, chunkSize = 64 * 1024) {
  const chunk = Buffer.alloc(chunkSize, 'x')
  let sent = 0

  return new Readable({
    read (cb) {
      if (sent >= totalBytes) {
        this.push(null)
        return cb(null)
      }
      const remaining = totalBytes - sent
      const buf = remaining >= chunk.length ? chunk : chunk.subarray(0, remaining)
      sent += buf.length
      this.push(buf)
      cb(null)
    }
  })
}

const dht = new DHT()
const server = dht.createServer((conn) => {
  console.log('got conn')

  conn.on('error', (err) => {
    if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
    console.warn('DHT error:', err)
  })

  const stream = fakeStream(DATA_SIZE)
  stream.on('error', (err) => console.error("Stream error", err))
  conn.on('close', () => stream.destroy())

  stream.pipe(conn)
})

const keyPair = DHT.keyPair(SEED && Buffer.alloc(32).fill(SEED))
server.listen(keyPair)

console.log('DHT public key', idEnc.normalize(keyPair.publicKey))
