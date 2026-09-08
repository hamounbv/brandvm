# Brand Vision Webflow custom code

Custom code for [brandvm.com](https://www.brandvm.com), built with TypeScript and esbuild. Webflow owns markup, layout and interactions. This repository owns the shared custom JavaScript and stylesheet.

## Development

Use Node **22.13 or newer** and pnpm **11.25.0**.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `https://brandvm.webflow.io/?bv-dev=1` to use localhost with live reload. `?bv-dev=0` returns to staging. The flag persists only on the staging domain. Custom domains always use the pinned production release, even with a dev query parameter.

```sh
pnpm check       # strict TypeScript
pnpm test        # lazy loading, loader fallback and startup regression tests
pnpm build       # minified JS, CSS and version.json
pnpm snippets    # generate Webflow head/footer from the deployment configuration
pnpm validate   # check + tests + build
```

## Structure

```text
src/index.ts              Webflow-ready entry point; one initialization per feature
src/modules/              newsletter, flare-border, counter, dot-map, read-more,
                          lenis and dropdown-close
src/globals.d.ts           types for libraries already supplied by Webflow
src/styles.css            custom CSS, in the original cascade order
dist/                     committed production build (never edit by hand)
webflow/head-base.html    current tracking, metadata and schema + asset placeholder
webflow/assets-loader.js development/staging selection and fallback
webflow/deployment.json  single source for production URLs and staging/dev locations
webflow/_header.html     generated Site Settings → Head code
webflow/_footer.html     generated Site Settings → Footer code
webflow/global-embed.html shared G | Embed Code contents
webflow/designer-preview.html optional temporary canvas preview snippet
scripts/                  snippet generation and release preparation
```

The source modules retain the existing selectors, public APIs and behavior. Swiper is installed **for types only**: its JavaScript and CSS still load from the CDN only when a newsletter slider approaches the viewport. Lenis remains optional and is not downloaded. Webflow supplies jQuery and GSAP; the bundle does not include duplicate copies. Initialization goes through `Webflow.push` so asynchronously arriving code can safely use those libraries.

## Delivery

| Environment | Custom assets |
| --- | --- |
| Production custom domains | Immutable jsDelivr URLs from `webflow/deployment.json` |
| `brandvm.webflow.io` | GitHub Pages staging, updated after a validated push to `main` |
| Staging with `?bv-dev=1` | `http://localhost:3000`, falling back to staging |

The production stylesheet is a real head `<link>` and works without JavaScript. Production never attempts localhost or staging assets and has no scroll lock. On staging, a failed stylesheet or script falls back to the next environment with matching CSS and JS. The bootstrap lives in the head; the bundle waits for Webflow readiness.

GitHub Pages uses the **GitHub Actions** source. The workflow runs type checking, regression tests and a build for pull requests. Pushes to `main` additionally publish the built assets to Pages. Production remains pinned until the generated Webflow snippets are published to custom domains.

Build output is deliberately committed. CI rebuilds and rejects differences, and verifies that the output files are tracked. This avoids release tags accidentally containing no `dist/`, and avoids repeatedly tracking/untracking build output. Run `pnpm build && pnpm snippets` before committing source or loader changes.

## Release

1. Update `package.json` to the next version; run `pnpm install` if needed. Never reuse a published version.
2. Build, commit and push the source changes. Let CI deploy staging, and verify behavior on the Webflow staging domain.
3. Run `pnpm release:prepare`. It validates the code, builds the output, updates both production asset URLs from the package version, and regenerates the snippets. It does not commit, tag, publish or push.
4. Review and commit the generated changes, then tag **that commit** and push the commit and tag. The tag must contain `dist/index.js`, `dist/styles.css` and `dist/version.json`.
5. Verify both new jsDelivr URLs return the expected files before changing Webflow. A new tag can take time to become available.
6. Paste `_header.html` and `_footer.html` into Webflow. Publish to the Webflow subdomain, verify, then publish to the production domains.

Do not use branch URLs or `@latest` in production. Do not move a pushed tag. If a release is wrong, use a new patch version.

Rollback: restore the deployment configuration and generated snippets from the previous release and republish. The pre-toolchain v1.0.2 head/footer and shared embed are saved in `webflow/rollback-v1.0.2.json`; restoring that release requires its old footer dropdown handler too.

## Webflow and Designer

`G | Embed Code` keeps its GTM noscript iframe and menu breakpoint rules. Its redundant custom stylesheet link is removed; the published site gets the stylesheet once from the head.

For Designer-only CSS preview, temporarily place `webflow/designer-preview.html` in an Embed. Use the staging link **or** the localhost link, not both; otherwise deleted local rules can remain active from staging. Remove the temporary preview Embed before publishing. Reload the Designer after changes; JavaScript does not run on the canvas.

Keep tracking IDs, verification metadata and the organization JSON-LD in `head-base.html`, then regenerate snippets. Page-specific code such as the Home hero, About orbit and HubSpot form embeds remains in Webflow for a separate migration. Webflow interaction visibility settings, including the delayed text issue, are separate from this build setup.
