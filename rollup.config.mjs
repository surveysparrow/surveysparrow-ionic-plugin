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
  external: ['@capacitor/core', '@capacitor/device', '@angular/core', '@angular/common', '@angular/router'],
  plugins: [nodeResolve()],
};