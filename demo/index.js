import CrdtMap from 'crdtmap'
import { createIndexedDBHandler } from '../dist/crdtmap-indexeddb.cjs'

const doc = CrdtMap()
const handler = createIndexedDBHandler('crdtmap-indexeddb-test', doc)

doc.set('key1', 'before-sync')

handler.whenSynced.then(() => {
  doc.set('key2', 'after-sync')
  console.log('whenSynced', doc.toJSON())
})
