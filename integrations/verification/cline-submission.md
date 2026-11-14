### GitHub Repository URL

https://github.com/Caravaca-Labs/pagetranslate-mcp

### Logo Image

![PageTranslate logo](https://raw.githubusercontent.com/Caravaca-Labs/pagetranslate-mcp/main/assets/logo-400.png)

400 x 400 PNG.

### Installation Testing

- [x] I have tested that Cline can successfully set up this server using only the README.md and/or llms-install.md file
- [x] The server is stable and ready for public use

### Additional Information

PageTranslate translates PDF, DOCX, EPUB and supported images while preserving layout. Uploading returns a quote; starting a translation requires a separate explicit confirmation and uses the account's existing word balance. Download links expire. Bring your own verified PageTranslate account and API key. AI translation is not certified human translation.

Install with Node.js 20+ and `npx -y pagetranslate-mcp@0.1.3`. [Cline installation guide](https://github.com/Caravaca-Labs/pagetranslate-mcp/blob/main/llms-install.md).

**Observed client test:** Cline CLI 3.0.74 ran in an isolated Node 24 Docker workspace containing only the public README and installation guide. Cline read the guide and successfully executed its native `cline mcp install` command. An actual Cline invocation of `pagetranslate__list_translations` reached the server and returned the expected API 401 for an intentionally invalid placeholder key. This verifies setup, transport and safe authentication failure, not an authenticated Cline translation. No real API key, host repository or admin credential was shared with Cline. [Sanitized evidence and limitations](https://github.com/Caravaca-Labs/pagetranslate-mcp/blob/main/verification/cline-20261114.json).

The server exposes upload_document, start_translation, get_translation, list_translations and download_translation. Separate authenticated server workflow verification is documented in the repository. MIT licensed.

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
