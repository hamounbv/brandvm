import { readFile, writeFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const config = JSON.parse(await readFile('webflow/deployment.json', 'utf8'));
const base = await readFile('webflow/head-base.html', 'utf8');
const loader = await readFile('webflow/assets-loader.js', 'utf8');
const { code } = await transform(`${loader}\nloadBrandVisionAssets(${JSON.stringify(config)});`, { minify: true, target: 'es2019' });
const assets = `<link id="bv-site-css" rel="stylesheet" href="${config.production.css}" />\n<script>${code.trim()}</script>`;
if (!base.includes('<!-- BV:ASSETS -->')) throw new Error('Missing head asset placeholder');
await writeFile('webflow/_header.html', base.replace('<!-- BV:ASSETS -->', assets));
await writeFile('webflow/_footer.html', '<!-- Custom JavaScript is loaded by the head bootstrap and initializes through Webflow.push. -->\n');
