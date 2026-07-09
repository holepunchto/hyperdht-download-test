#!/usr/bin/env node

const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')
const { command, arg, flag } = require('paparam')
const { Readable } = require('streamx')

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

const cmd = command(
  'dht-server',
  flag('--seed <seed>|-s <seed>', 'Seed to derive the key pair from'),
  arg('[data-size]', 'Data size to stream in bytes'),
  ({ flags, args }) => {
    const { seed } = flags
    const { dataSize = 10 * 1024 * 1024 * 1024 } = args // 10GB

    const dht = new DHT()
    const server = dht.createServer((conn) => {
      console.log('got conn')

      conn.on('error', (err) => {
        if (err.code === 'ECONNRESET' || err.message === 'Writable stream closed prematurely') return
        console.warn('DHT error:', err)
      })

      const stream = fakeStream(dataSize)
      stream.on('error', (err) => console.error("Stream error", err))
      conn.on('close', () => stream.destroy())

      stream.pipe(conn)
    })

    const keyPair = DHT.keyPair(seed && Buffer.alloc(32).fill(seed))
    server.listen(keyPair)

    console.log('DHT public key', idEnc.normalize(keyPair.publicKey))
  }
)

cmd.parse()
