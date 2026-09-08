import * as esbuild from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const dev = process.argv.includes('--dev');
const { version } = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));
const config = {
  entryPoints: ['src/index.ts', 'src/styles.css'],
  bundle: true,
  format: 'iife',
  outdir: 'dist',
  minify: !dev,
  sourcemap: dev,
  target: 'es2019',
  legalComments: 'none',
  logLevel: 'info',
  define: { __BV_VERSION__: JSON.stringify(version) },
  banner: dev ? { js: "new EventSource('http://localhost:3000/esbuild').addEventListener('change', () => location.reload());" } : {},
};

if (dev) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  await ctx.serve({ servedir: 'dist', host: '127.0.0.1', port: 3000, cors: { origin: '*' } });
  console.log('Webflow staging: add ?bv-dev=1 to use http://localhost:3000');
} else {
  await esbuild.build(config);
  await writeFile('dist/version.json', JSON.stringify({ version }) + '\n');
}
