import CrdtMap from 'crdtmap'
import * as encoding from 'lib0/dist/encoding.cjs'
import * as decoding from 'lib0/dist/decoding.cjs'
import * as idb from 'lib0/dist/indexeddb.cjs'
import * as mutex from 'lib0/dist/mutex.cjs'

export function createIndexedDBHandler (name, doc) {
  const mux = mutex.createMutex()

  let db
  const _db = idb.openDB(name, db =>
    idb.createStores(db, [
      ['snapshots']
    ])
  )

  const fetchStored = (db) => {
    const [snapshotStore] = idb.transact(db, ['snapshots'])
    const snapshot = {}

    return idb.iterate(snapshotStore, undefined, (data, key) => {
      const decoder = decoding.createDecoder(data)
      const value = decoding.readAny(decoder)

      snapshot[key] = value
    })
      .then(() => doc.applySnapshot(snapshot))
      .then(() => snapshot)
  }

  const whenSynced = _db.then(__db => {
    const currentSnapshot = doc.getSnapshotFromTimestamp(0)

    return fetchStored(__db)
      .then(storedSnapshot => {
        // Wait until here to set db to avoid onUpdate called when fetching stored snapshot
        db = __db

        // And now store snapshot from before indexeddb sync
        // To make sure we only store latest data, we filter snapshot first by getting appliedSnapshot from a dummy doc
        const dummyDoc = CrdtMap()
        dummyDoc.applySnapshot(storedSnapshot)
        dummyDoc.on('snapshot', (_, appliedSnapshot) => {
          // Store applied snapshot, which is the changes we had in the doc prior to loading indexeddb
          storeSnapshot(appliedSnapshot)
        })

        // When we apply this snapshot, "snapshot" will be emitted with applied part of snapshot, ensuring we're storing latest
        dummyDoc.applySnapshot(currentSnapshot)
      })
  })

  const storeSnapshot = (snapshot) => mux(() => {
    if (db) {
      for (const [key, value] of Object.entries(snapshot)) {
        const [snapshotStore] = idb.transact(db, ['snapshots'])

        const encoder = encoding.createEncoder()
        encoding.writeAny(encoder, value)
        const data = encoding.toUint8Array(encoder)

        idb.put(snapshotStore, data, key)
      }
    }
  })

  // Updates are always latest data, so safe to store as snapshot
  const onUpdate = storeSnapshot

  // Snapshot should only stored applied snapshot, to not store accidental old data
  const onSnapshot = (_, appliedSnapshot) => storeSnapshot(appliedSnapshot)

  const handler = {
    whenSynced,
    destroy () {
      doc.off('update', onUpdate)
      doc.off('snapshot', onSnapshot)
      doc.off('destroy', this.destroy)

      return _db.then(db => db.close())
    }
  }

  doc.on('update', onUpdate)
  doc.on('snapshot', onSnapshot)
  doc.on('destroy', handler.destroy)

  return handler
}
