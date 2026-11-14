# PageTranslateAI Document Translator

A small, public BYOK starter app for getting a PageTranslateAI document quote,
reviewing it, and optionally starting a translation with existing credits.

## Bring your own key

Each visitor supplies their own PageTranslateAI API key in the password field.
The app keeps it in component memory only. It is not written to local storage,
session storage, cookies, URLs, or a database, and it is not logged. The key is
sent in the `Authorization` header to this app's server-side proxy, which
forwards it only to `https://api.pagetranslate.ai`.

Uploading a file requests a quote only. The app will not start a translation
until the visitor separately confirms the quote, and both the interface and
proxy require `cost_cents` to be exactly `0`. Translation requests use only
`payment_method: "credits"`; this starter does not charge cards or provide
checkout, account, or admin features.

Review a remix's code before entering an API key. A remix owner can change the
code or hosting configuration.

## Supported files

- Documents: PDF, DOCX, EPUB
- Images: PNG, JPG/JPEG, WEBP, TIFF, BMP, GIF
- Maximum file size: 100 MB
- PDFs: 1,000 pages or fewer

PDF page counts are checked with `pdf-lib` before upload, with no system PDF
utility required. Multipart uploads use Node's native FormData and Blob so
the request body and boundary match. The proxy removes temporary upload files
after forwarding them.

## Run or remix

1. Remix this project in Replit.
2. Start the existing **API Server** workflow and the **PageTranslateAI
   Document Translator** web workflow.
3. Open the web preview, enter your own PageTranslateAI API key, choose a file
   and target language, and request a quote.
4. Review the word count and quote. If the quote is zero cents, confirm to use
   existing word credits and start the translation.

The web workflow supplies its required port and path settings. The API server
is already routed through the shared `/api` path. Do not put a visitor key in
environment variables or a `.env` file.

## API surface

The server proxy is intentionally limited to these PageTranslateAI endpoints:

- `POST /upload/`
- `GET /jobs/`
- `GET /jobs/{job_id}`
- `POST /jobs/{job_id}/translate`
- `POST /jobs/{job_id}/download-link`

It does not accept a caller-supplied upstream URL. It enforces upload type,
file size, PDF page count, zero-cent quote, completed-job download links, and
credits-only translation. Provider errors are returned to the visitor without
logging the visitor's key.

### API contract

The upload response includes a `job_id` and nested `quote`. Get the job to
inspect its top-level `word_count`, `cost_cents`, status and progress. The
selected language is provided when uploading; starting the same job requires
only `{"payment_method":"credits"}` after explicit confirmation. An HTTP 429
means the account's upload limit was reached; wait before trying again.

For development, `pnpm run typecheck` checks the workspace. The API contract
and generated client can be refreshed with
`pnpm --filter @workspace/api-spec run codegen`.

## Online versions

Prefer a browser?

- [PageTranslate PDF translator](https://pagetranslate.ai/pdf-translator)
- [PageTranslate EPUB translator](https://pagetranslate.ai/epub-translator)
- [PageTranslate DOCX translator](https://pagetranslate.ai/docx-translator)
- [Translate a book](https://pagetranslate.ai/translate-a-book)
- [Document translation software](https://pagetranslate.ai/document-translation-software)
- [AI novel translator](https://pagetranslate.ai/translate-a-book/ai-novel-translator)
- [Translate a large PDF](https://pagetranslate.ai/pdf-translator/translate-large-pdf)

## Guides and free tools

- [How much does it cost to translate a book](https://pagetranslate.ai/faq/how-much-does-it-cost-to-translate-a-book)
- [Translation cost calculator](https://pagetranslate.ai/tools/translation-cost-calculator)
- [How to translate a scanned PDF](https://pagetranslate.ai/faq/how-to-translate-scanned-pdf)
- [How to open EPUB on Kindle](https://pagetranslate.ai/blog/how-to-open-epub-on-kindle)
- [Translation software for legal documents](https://pagetranslate.ai/document-translation-software/translation-software-for-legal-documents)
- [Translate English to Spanish documents](https://pagetranslate.ai/document-translation-software/google-translate-english-to-spanish-documents)
- [EPUB merger](https://pagetranslate.ai/tools/epub-merger)
- [Free tools for authors](https://pagetranslate.ai/tools)

## PageTranslateAI links

- [PageTranslateAI](https://pagetranslate.ai)
- [API documentation](https://pagetranslate.ai/api)
- [Privacy policy](https://pagetranslate.ai/privacy)
