# PageTranslate Integrations

These connectors use your own verified PageTranslate account, API key and word
balance. Upload creates a quote; translation starts only after a separate
confirmation. The examples use existing word credits and do not charge cards.

## Connectors

| Platform | Public entry point | Source and verification |
| --- | --- | --- |
| n8n | [npm node](https://www.npmjs.com/package/n8n-nodes-pagetranslate) | [Native source](https://github.com/Caravaca-Labs/n8n-nodes-pagetranslate) and [self-contained E2E setup](https://github.com/Caravaca-Labs/n8n-nodes-pagetranslate/blob/main/verification/README.md). Version 0.1.1 is published; verification approval is pending. |
| RapidAPI | [API catalog and documentation](https://rapidapi.com/CaravacaLabs/api/pagetranslateai-document-translation/details) | [OpenAPI definition](rapidapi/openapi.json); real gateway translation and PDF download verified. |
| Replit | [Remixable listing](https://replit.com/@caravacaai/PageTranslateAI-Translator?v=1) and [live demo](https://page-translate-ai-translator--caravacaai.replit.app/) | Real published-UI quote, confirmed start, progress and PDF download verified. Free demo hosting is temporary. |
| Retool | [Document translator](https://caravacalabs--pagetranslateai-document-translator.retool.app/) | Real published-UI workflow verified. Login is required; this is not an anonymous public app. |
| Bubble | [Marketplace plugin](https://bubble.io/plugin/pagetranslateai-pdf-translator-1794680671100x147408192064192500) | Public version 1.0.0. All five real plugin API calls verified; a separate Bubble application UI E2E is not claimed. |

Flowise's hosted service was discontinued; no new official listing is claimed.
OpenAI and Cline review submissions are separate from these hosted connectors.
The [Cline setup evidence](../verification/cline-20261114.json) and
[submission](https://github.com/cline/mcp-marketplace/issues/3809) remain public.

## API Workflow

Send `Authorization: Bearer YOUR_PAGETRANSLATE_KEY` to
`https://api.pagetranslate.ai/api/v1`, never in a URL or public template.

1. `POST /upload/` with multipart `file` and `requested_language`.
2. `GET /jobs/{job_id}` to review the word count, price and status.
3. After explicit confirmation, `POST /jobs/{job_id}/translate` with
   `{"payment_method":"credits"}`. Insufficient balance fails without charging a card.
4. Poll the job about every 30 seconds with a bounded limit. `GET /jobs/` lists recent jobs.
5. Once completed, `POST /jobs/{job_id}/download-link`. Prefix `download_path`
   with `https://api.pagetranslate.ai`; the link normally expires after one hour.

Only upload documents you have permission to process. AI translation is not
certified human translation. See [API documentation](https://pagetranslate.ai/api),
[privacy](https://pagetranslate.ai/privacy) and [support](https://pagetranslate.ai/contact).

## Verification

The [verification guide](verification/README.md) includes repeatable checks,
[dated results and limitations](verification/platform-live-20261114.json),
[download digests](verification/download-proofs-20261114.json), actual Spanish
PDF artifacts, and snapshots of the deployed Replit/Retool fixes. These are
historical observations from 2026-11-14, not guarantees of current approval or
uptime. No private keys, credential databases or usable signed links are included.

The n8n source, scanner evidence and repeatable runner live in the
[public native-node repository](https://github.com/Caravaca-Labs/n8n-nodes-pagetranslate/blob/main/verification/README.md).
Using these integrations or reviewing their evidence does not require access to
an internal tracking repository.

## Online versions

Prefer a browser?

- [PageTranslate PDF translator](https://pagetranslate.ai/pdf-translator)
- [PageTranslate EPUB translator](https://pagetranslate.ai/epub-translator)
- [PageTranslate DOCX translator](https://pagetranslate.ai/docx-translator)
- [Translate a book](https://pagetranslate.ai/translate-a-book)
- [Document translation software](https://pagetranslate.ai/document-translation-software)
- [AI novel translator](https://pagetranslate.ai/translate-a-book/ai-novel-translator)
- [Translate a large PDF](https://pagetranslate.ai/pdf-translator/translate-large-pdf)

### Guides and free tools

- [How much does it cost to translate a book](https://pagetranslate.ai/faq/how-much-does-it-cost-to-translate-a-book)
- [Translation cost calculator](https://pagetranslate.ai/tools/translation-cost-calculator)
- [How to translate a scanned PDF](https://pagetranslate.ai/faq/how-to-translate-scanned-pdf)
- [How to open EPUB on Kindle](https://pagetranslate.ai/blog/how-to-open-epub-on-kindle)
- [Translation software for legal documents](https://pagetranslate.ai/document-translation-software/translation-software-for-legal-documents)
- [Translate English to Spanish documents](https://pagetranslate.ai/document-translation-software/google-translate-english-to-spanish-documents)
- [EPUB merger](https://pagetranslate.ai/tools/epub-merger)
- [Free tools for authors](https://pagetranslate.ai/tools)
