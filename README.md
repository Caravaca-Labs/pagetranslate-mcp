# PageTranslate for Claude

A PDF translator and document translator for Claude. Name a file on your computer and a language, and
[PageTranslate](https://pagetranslate.ai) translates the whole document and returns the same kind of file: a PDF with
its pages, tables and images in place, a DOCX that is still a DOCX, an EPUB that is still an EPUB.
Scanned PDFs and photos are read with OCR first.

The plugin adds one MCP server (`pagetranslate`) and four skills:

- `pagetranslate-pdf-translator`: Translate a PDF with PageTranslate and get a PDF back: the same pages, tables, fonts and images, in the new language.
- `pagetranslate-scanned-pdf-translator`: Translate a scanned PDF or a photo of a page. PageTranslate reads it with OCR, translates it, and puts the translation back on the page.
- `pagetranslate-book-translator`: Translate a whole book with PageTranslate: an EPUB, a DOCX manuscript or a PDF. One upload, one translated file in the same format.
- `pagetranslate-document-translator`: Translate a Word document or business file with PageTranslate: a DOCX comes back as a DOCX, with its headings, tables, lists and images.

## Setup

```
/plugin install pagetranslate --marketplace Caravaca-Labs/pagetranslate-mcp
```

Installing the plugin asks for a PageTranslate API key. Create one at https://pagetranslate.ai/dashboard/api-keys
(free account, verified email).

## What it sends, and what it costs

The file you name is uploaded to PageTranslate over HTTPS under your account. Uploading is free and
returns the exact price (8¢ per 1,000 words, $3.99 minimum per document). Claude cannot spend money:
you pay in your browser, or the job runs on words you already bought. See the
[privacy policy](https://pagetranslate.ai/privacy).

Source, issues and the other ways to install: https://github.com/Caravaca-Labs/pagetranslate-mcp

MIT License.
