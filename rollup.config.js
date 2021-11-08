export default [
  {
    input: 'src/index.js',
    external: id => /^(lib0|crdtmap)/.test(id),
    output: {
      name: 'CrdtMapIndexedDB',
      file: 'dist/crdtmap-indexeddb.cjs',
      format: 'cjs',
      sourcemap: true
    }
  }
]
