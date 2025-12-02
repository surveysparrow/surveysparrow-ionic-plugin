import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'capacitorSurveySparrowIonicPlugin',
      globals: {
        '@capacitor/core': 'capacitorExports',
        'axios': 'axios',
        'uuid': 'uuid',
        '@capacitor/device': 'capacitorDevice',
      },
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/plugin.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  external: ['@capacitor/core', 'axios', 'uuid', '@capacitor/device'],
  plugins: [nodeResolve()],
};