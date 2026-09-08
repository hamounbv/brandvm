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

// Designer renders Embed links but ignores Site Settings and inline scripts.
// Match the production URL so the published page reuses the same cached file.
const embedBase = await readFile('webflow/global-embed-base.html', 'utf8');
const designerStyles = `<!-- Persistent Designer preview; the published head owns the active stylesheet. -->
<link data-bv-designer-css rel="stylesheet" href="${config.production.css}" />
<script>
  if (document.getElementById('bv-site-css')) {
    document.querySelectorAll('link[data-bv-designer-css]').forEach(function (link) {
      link.remove();
    });
  }
</script>`;
if (!embedBase.includes('<!-- BV:DESIGNER-CSS -->')) throw new Error('Missing Designer CSS placeholder');
await writeFile('webflow/global-embed.html', embedBase.replace('<!-- BV:DESIGNER-CSS -->', designerStyles));
