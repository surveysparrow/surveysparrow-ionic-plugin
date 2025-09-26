import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'dist/esm/index.js',
  plugins: [
    nodeResolve({
      preferBuiltins: false,
    }),
  ],
  context: 'globalThis',
  moduleContext: {
    'dist/esm/spotchecks/SpotchecksListener.js': 'globalThis',
    'dist/esm/spotchecks/SpotcheckStateService.js': 'globalThis',
    'dist/esm/spotchecks/SpotCheck.js': 'globalThis',
    'dist/esm/spotchecks/SpotCheckComponent.js': 'globalThis',
  },
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'capacitorSurveySparrowIonicPlugin',
      globals: {
        '@capacitor/core': 'capacitorExports',
        '@capacitor/device': 'capacitorDevice',
        '@angular/core': 'ng.core',
        '@angular/common': 'ng.common',
        '@angular/platform-browser': 'ng.platformBrowser',
        'rxjs': 'rxjs',
        'uuid': 'uuid',
        'axios': 'axios',
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
  external: [
    '@capacitor/core',
    '@capacitor/device',
    '@angular/core',
    '@angular/common',
    '@angular/platform-browser',
    'rxjs',
    'uuid',
    'axios',
  ],
};
