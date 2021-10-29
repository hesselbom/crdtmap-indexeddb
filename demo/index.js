import VDoc from 'vjs'
import { createIndexedDBHandler } from '../dist/v-indexeddb.cjs'

const doc = VDoc()
const handler = createIndexedDBHandler('v-indexeddb-test', doc)

doc.set('key1', 'before-sync')

handler.whenSynced.then(() => {
  doc.set('key2', 'after-sync')
  console.log('whenSynced', doc.toJSON())
})
