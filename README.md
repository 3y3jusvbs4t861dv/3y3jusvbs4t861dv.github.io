# Sitemap KV sync update

## Deployment
1. Back up your original GitHub `index.html` and use the sitemap EXPORT feature.
2. Upload `index.html`, `worker/index.js`, `wrangler.jsonc`, and `.assetsignore` into the ROOT of your GitHub repository (preserve other PDFs/images). Commit to `main`.
3. Wait for the Cloudflare Git deployment to succeed.
4. Verify `/api/data` returns `{}` or a JSON sitemap.
5. Add `API_WRITE_TOKEN` as a Worker secret using `npx.cmd wrangler secret put API_WRITE_TOKEN` from the repository folder. Do not put the secret in source files.

## Usage
1. Open the sitemap on its **Cloudflare Worker URL**, not github.io. The browser API uses `/api/data` on the same origin.
2. Unlock the developer menu. Click **CLOUD CONNECT** and enter the `API_WRITE_TOKEN` secret value. It is kept only in memory for this tab.
3. Your subsequent sitemap changes automatically POST to KV (debounced). The cloud has a single shared sitemap, so simultaneous edits from multiple devices can overwrite each other.
4. On another device, use **CLOUD LOAD** to fetch the latest saved cloud sitemap. The app asks before replacing the local copy. Then use **CLOUD CONNECT** there if you want that device to save edits.
5. **EXPORT** a backup before the first cloud load. No automatic first-upload occurs on connection.

## Notes
- The cloud API is public-read and password-protected write. Anyone knowing the Cloudflare Worker URL can read the stored links/settings. Do not store private data in the sitemap.
- The four-digit developer code is excluded from KV writes and kept local when loading; however the original uploaded HTML already embeds a developer code, so it is NOT secure authentication.
- Do not share the write secret, commit it to GitHub, or save it in HTML.
- Cloudflare KV is eventually consistent, and edits from different devices may take time to propagate.
- Existing remote JSON polling is preserved; if you have published sitemap-data.json files, they can still influence the site. Remove or disable them if unwanted.
- The cloud write secret must exist before CLOUD CONNECT can save. If it doesn't, saves will report 401.
