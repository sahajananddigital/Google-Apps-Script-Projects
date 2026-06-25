/**
 * Exposes bundled IIFE exports as global GAS functions (onOpen, doGet, etc.).
 */
const viteExposeGasFunctions = () => ({
  name: 'vite-expose-gas-functions',
  generateBundle(options, bundle) {
    const entryChunk = Object.values(bundle).find((chunk) => chunk.type === 'chunk' && chunk.isEntry);
    if (entryChunk?.exports?.length > 0) {
      const exposureCode = entryChunk.exports
        .map((fnName) => `function ${fnName}(...args) { return ${options.name}.${fnName}(...args); }`)
        .join('\n');
      entryChunk.code += `\n\n${exposureCode}`;
    }
  },
});

export default viteExposeGasFunctions;
