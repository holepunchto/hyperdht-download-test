const DHT = require('hyperdht')
const idEnc = require('hypercore-id-encoding')

const KEY = process.argv[2]

if (!KEY) {
  console.error('Usage: node dht-client.js <dht-public-key>')
  process.exit(1)
}

const dht = new DHT()
const conn = dht.connect(idEnc.decode(KEY))

let received = 0
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

const interval = setInterval(() => {
  const secs = (Date.now() - start) / 1000
  console.log(`received ${received} bytes in ${secs.toFixed(1)}s (${(received / secs / 1e6).toFixed(1)} MB/s)`)
}, 1000)
