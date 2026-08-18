# brandvm-site-code

Version-controlled custom code for **brandvm.com** (Webflow site `68b9f0236581de795cba8ec2`), served through **jsDelivr**.

```
css/brandvm.css        → all site custom CSS (single source of truth)
js/brandvm.js          → all site custom JS (Lenis init + former Slater Global.js)
webflow/_header.html   → the Site Settings → Head block (paste into Webflow)
webflow/_footer.html   → the Site Settings → Footer block (paste into Webflow)
```

`css/brandvm.css` consolidates: the Slater global stylesheet + the `G | Embed Code` "staging" style block + the 7 scattered page/component CSS embeds (deduped; the six drifting project-list copies merged into one canonical block). `js/brandvm.js` = the guarded Lenis init (moved out of the footer inline script) + the former Slater `Global.js` verbatim.

## jsDelivr rules (the important ones)

- **The repo must be public.** jsDelivr's `/gh/` endpoint doesn't serve private repos. (Fine — this code ships to every visitor's browser anyway.)
- URL shape: `https://cdn.jsdelivr.net/gh/USER/REPO@VERSION/path/file`
- **Auto-minify:** request `brandvm.min.css` / `brandvm.min.js` and jsDelivr generates the minified file for you — commit only the readable source.
- **Pin a tag for production** (`@1.0.0`). Tagged URLs are cached permanently on the CDN — deploys are immutable and instant to roll back (just point the snippet at the previous tag).
- `@main` works for testing but is cached up to ~12 h — never use it in the production snippet.
- Emergency cache purge: `https://purge.jsdelivr.net/gh/USER/REPO@1.0.0/css/brandvm.min.css`
- Optional: combine both JS files into one request with the `/combine/` endpoint once things are stable.

## Release workflow

1. Edit `css/brandvm.css` or `js/brandvm.js`, commit.
2. Tag: `git tag v1.0.1 && git push --tags` (tag names with `v` work as `@1.0.1` on jsDelivr).
3. Bump the version in `webflow/_header.html` + `webflow/_footer.html`, commit.
4. Paste the updated snippet(s) into Webflow Site Settings → Custom Code, publish.
5. Verify the new file loads (DevTools → Network), spot-check pages.

Rollback = step 3–4 with the previous tag.

## One-time Webflow cutover

**Add (Site Settings):** replace the head with `webflow/_header.html` (keeps X pixel, GTM, metas, Ahrefs, Finsweet, hide-styles, JSON-LD — swaps Slater CSS for the jsDelivr link and drops the dead commented-out viewport meta) and the footer with `webflow/_footer.html`.

**Then remove, in this order (everything is now in the repo files):**

1. `G | Embed Code` component → keep **only** the GTM noscript; delete the duplicate Slater `<link>` and the entire "staging only" `<style>` block.
2. `S | Projects` component → delete its CSS embed.
3. Page CSS embeds on Work, Industries / Web Designs / UI-UX / Branding / SEO templates → delete.
4. Industries page head `<style>` (reduced-motion rule) → delete.
5. Style Guide (draft) embed → delete.
6. `G | Embed Code 2` component → no longer needed as the CSS carrier. Either delete it, or keep it **unplaced** as an on-demand Designer preview aid (drop it on a page while designing, remove before publish — and expect it to drift from the repo unless refreshed).
7. /faq page head → remove the duplicate Finsweet loader (unrelated to this migration, but it's sitting right there).
8. Slater → archive both files; the repo is the only source of truth now. Slater JS/CSS URLs must no longer appear anywhere in Webflow.

**QA before publishing:** hero panorama alignment on Home, service-tab icons, newsletter slider stacking, industry tab hover, read-more toggles, project-list bento (4th card title is now visible on mobile on the service/industry templates — deliberate, matches the S | Projects behavior), smooth scroll working, GTM firing (Tag Assistant), no 404s in the Network tab.

**Known trade-off:** external stylesheets don't render in the Designer canvas (same as Slater). For canvas work, use the unplaced `G | Embed Code 2` trick above or the Slater-style temporary inline embed, and delete before publish.

## House rules

- Never edit CSS/JS inline in Webflow again — if it's style or behavior, it goes in this repo.
- Page-specific scripts (About orbit, Home hero panels, Industries carousel tilt) still live in Webflow page settings today; migrate them here later if wanted (load them site-wide with a body-class or element-presence guard, or as separate files).
- v1.0.0 ships behavior-identical code. Optional future cleanups: drop the DotMap module (dead until an `svg[data-dotmap]` exists — it's in git history if the map section ships), drop the console.log banner.
