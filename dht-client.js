#!/usr/bin/env node
const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')
const { command, arg } = require('paparam')

const cmd = command(
  'dht-client',
  arg('<dht-public-key>', 'Public key to connect to'),
  ({ args }) => {
    const { dhtPublicKey } = args

    const dht = new DHT()
    const conn = dht.connect(idEnc.decode(dhtPublicKey))

    let received = 0
    let interval
    const start = Date.now()

    conn.on('open', () => console.log('connected'))

    conn.on('data', (chunk) => {
      received += chunk.length
    })

    conn.on('error', (err) => {
      console.error('DHT error:', err)
    })

    conn.on('close', () => {
      console.log('connection closed')
      clearInterval(interval)
    })

    interval = setInterval(() => {
      const secs = (Date.now() - start) / 1000
      console.log(`received ${received} bytes in ${secs.toFixed(1)}s (${(received / secs / 1e6).toFixed(1)} MB/s)`)
    }, 1000)
  }
)

cmd.parse()
