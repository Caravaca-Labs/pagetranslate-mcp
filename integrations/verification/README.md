# Live Verification - 2026-11-14

`platform-live-20261114.json` records observed behavior, fixes, the exact 800-word
ledger, cleanup and limitations. No purchases or admin credentials were used.
`download-proofs-20261114.json` contains byte counts and SHA-256 digests for the
actual Spanish PDFs under `artifacts/`. The input was the public 100-word
`sample.pdf` in this repository's `test/fixtures/` directory.

## Repeat The UI Checks

Use a disposable, verified account with at least 100 words per translation and
enough hourly upload allowance. Follow the platform links in the
[integration guide](../README.md).
Never put a real API key in a public template or exported artifact.

1. Enter the dedicated API key privately and select the public sample PDF and Spanish.
2. Upload without starting. Verify pending status, 100 words, zero cash cost,
   and a disabled start control until its separate confirmation is checked.
3. Confirm spending exactly 100 existing words, start once, and wait for bounded
   status polling to reach completed and 100 percent.
4. Request the download, verify its PDF bytes and translated content, then clear
   the key and test defaults. Preserve screenshots and a digest, not signed URLs.

Replit and Retool were exercised through their actual published UIs. Bubble was
exercised through its real plugin API-call initializer for all five operations;
this is explicitly not a separate Bubble application UI test. Bubble's final
download response uses a nonfunctional example to avoid retaining a signed URL
as reusable sample data. The existing public plugin remains version 1.0.0.

`deployed/` contains source snapshots of the targeted fixes applied through each
platform's code editor. These are verification snapshots, not standalone apps:

- `replit-app-fixed.tsx`: `artifacts/page-translate-ai/src/App.tsx`.
- `replit-proxy-fixed.ts`: `artifacts/api-server/src/routes/page-translate.ts`.
- `replit-readme-fixed.md`: `artifacts/page-translate-ai/README.md`.
- `retool-upload-fixed.ts`: `backend/pagetranslate/upload.ts`.

Replit's workspace typecheck and production builds passed. The web build needs
the workflow-provided environment, or `PORT=3000 BASE_PATH=/` for a manual build.
The API server additionally depends on `pdf-lib@1.17.1` after the portable PDF
validator fix. Retool's function-approval requirement was never disabled.

## Repeat The Gateway Check

`rapidapi-live.mjs` reads ignored `private/integrations/e2e-account.json` and
`private/integrations/rapidapi-test-key.json` from the repository root; neither
belongs in source control. Use JSON objects with `api_key` and `key` properties,
respectively, and restrict their permissions to the owner (0600). With the
dedicated account and subscriber keys configured privately, run from the root:

```bash
CONFIRM_SPEND_100_WORDS=yes node integrations/verification/rapidapi-live.mjs
```

This performs real uploads and consumes exactly 100 words on a successful start.
Do not rerun it merely to refresh evidence. An already completed report can be
checked without spending more words using its job ID and `RESUME_COMPLETED=yes`.
`download-proofs.mjs` checks UI-obtained private signed links without uploading
or starting anything. Obtain fresh links through the actual platform first and
store each as a private `{"url":"SIGNED_URL"}` object at
`private/integrations/{replit,retool,bubble}-download.json`. Never publish them.

The native n8n node has its own public [E2E setup and evidence](https://github.com/Caravaca-Labs/n8n-nodes-pagetranslate/blob/main/verification/README.md).

## Review Queues

n8n received the genuine, uncut 299-second recording and now reports manual
review **UNDER REVIEW**. Its receipt says review typically takes up to four
weeks. Cline submission [#3809](https://github.com/cline/mcp-marketplace/issues/3809)
is open. Neither status means approval. OpenAI's existing 1.0.0 submission is
already In review and was not cancelled or replaced.
