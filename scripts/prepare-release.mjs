import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Run on a reviewed, tested main commit. This prepares files, never pushes or
// moves a tag. Commit the result, then tag that commit after checking the diff.
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Use a stable semver version');
const tags = execFileSync('git', ['tag', '--list', `v${version}`], { encoding: 'utf8' }).trim();
if (tags) throw new Error(`v${version} already exists. Choose a new version; never move a published tag.`);
execFileSync('pnpm', ['validate'], { stdio: 'inherit' });
const config = JSON.parse(await readFile('webflow/deployment.json', 'utf8'));
config.production = {
  version,
  js: `https://cdn.jsdelivr.net/gh/hamounbv/brandvm@${version}/dist/index.js`,
  css: `https://cdn.jsdelivr.net/gh/hamounbv/brandvm@${version}/dist/styles.css`,
};
await writeFile('webflow/deployment.json', JSON.stringify(config, null, 2) + '\n');
execFileSync('pnpm', ['snippets'], { stdio: 'inherit' });
console.log(`Prepared v${version}. Review and commit dist/ and Webflow snippets, then create an immutable tag.`);
