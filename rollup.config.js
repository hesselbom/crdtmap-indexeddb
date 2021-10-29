export default [
  {
    input: 'src/index.js',
    external: id => /^(lib0|vjs)/.test(id),
    output: {
      name: 'VIndexedDB',
      file: 'dist/v-indexeddb.cjs',
      format: 'cjs',
      sourcemap: true
    }
  }
]
