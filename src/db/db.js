import { openDB } from 'idb'

const DB_NAME = 'itn-qr'
const DB_VERSION = 1

let dbPromise = null

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('qrcodes')) {
          const s = db.createObjectStore('qrcodes', { keyPath: 'id', autoIncrement: true })
          s.createIndex('category', 'category')
          s.createIndex('clientId', 'clientId')
          s.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains('clients')) {
          const s = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true })
          s.createIndex('name', 'name')
          s.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains('orders')) {
          const s = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true })
          s.createIndex('clientId', 'clientId')
          s.createIndex('paymentStatus', 'paymentStatus')
          s.createIndex('productionStatus', 'productionStatus')
          s.createIndex('createdAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export async function countAll(storeName) {
  const db = await getDb()
  return db.count(storeName)
}

export async function getAll(storeName) {
  const db = await getDb()
  return db.getAll(storeName)
}

export async function add(storeName, value) {
  const db = await getDb()
  return db.add(storeName, { ...value, createdAt: value.createdAt ?? new Date().toISOString() })
}

export async function put(storeName, value) {
  const db = await getDb()
  return db.put(storeName, value)
}

export async function remove(storeName, id) {
  const db = await getDb()
  return db.delete(storeName, id)
}

export async function getSetting(key, fallback = null) {
  const db = await getDb()
  const row = await db.get('settings', key)
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  const db = await getDb()
  return db.put('settings', { key, value })
}

export const STORES = ['qrcodes', 'clients', 'orders']

export async function exportAll() {
  const db = await getDb()
  const out = { app: 'itn-qr', version: 1, exportedAt: new Date().toISOString() }
  for (const n of STORES) out[n] = await db.getAll(n)
  out.settings = (await db.getAll('settings')).filter((s) => s.key !== 'pinHash')
  return out
}

export async function replaceAll(data) {
  const db = await getDb()
  const tx = db.transaction([...STORES, 'settings'], 'readwrite')
  for (const n of STORES) {
    await tx.objectStore(n).clear()
    for (const r of data[n] || []) await tx.objectStore(n).put(r)
  }
  for (const s of data.settings || []) if (s.key !== 'pinHash') await tx.objectStore('settings').put(s)
  await tx.done
}
