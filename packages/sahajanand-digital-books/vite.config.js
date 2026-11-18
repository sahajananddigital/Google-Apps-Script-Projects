import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Custom Vite plugin to expose exported functions from the bundled IIFE module
 * to the global scope for Google Apps Script execution.
 */
const viteExposeGasFunctions = () => ({
  name: 'vite-expose-gas-functions',
  generateBundle(options, bundle) {
    const entryChunk = Object.values(bundle).find((chunk) => chunk.type === 'chunk' && chunk.isEntry);
    if (entryChunk) {
      const exposureCode = entryChunk.exports
        .map((fnName) => `function ${fnName}() { return ${options.name}.${fnName}.apply(this, arguments); }`)
        .join('\n');
      entryChunk.code += `\n\n${exposureCode}`;
    }
  },
});

const targets = [
  { src: 'appsscript.json', dest: '.' },
];

export default defineConfig(({ mode }) => ({
  plugins: [viteExposeGasFunctions(), viteStaticCopy({ targets })],
  build: {
    target: 'es2020',
    minify: mode !== 'development',
    outDir: resolve(__dirname, 'dist'),
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'app',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'code.js',
      },
    },
  },
}));
