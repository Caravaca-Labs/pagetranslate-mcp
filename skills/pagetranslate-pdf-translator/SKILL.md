---
name: pagetranslate-pdf-translator
description: "Use this skill whenever the user wants a PDF translated into another language and returned as a PDF with its pages, tables, fonts and images in place: manuals, contracts, reports, papers, brochures, large PDFs. Uploads the file to PageTranslate, shows the exact price first, and downloads the translated PDF."
license: MIT
---

# PageTranslate PDF Translator

Translate a PDF with PageTranslate and get a PDF back: the same pages, tables, fonts and images, in the new language.

[PageTranslate](https://pagetranslate.ai) translates the file itself, not pasted text. For a sentence or a
paragraph, translate it yourself.

## When to use

- The user names a `.pdf` file and a language, or asks to translate a PDF.
- The layout matters: tables, columns, figures, page numbers, headers and footers.
- The PDF is long. One file can have up to 1,000 pages and 100 MB.

## Before you start

- **Target language:** a code such as `es`, `fr`, `de`, `it`, `ja`, `ko`, `ar`, `hi`, `ru`.
  Use `pt-BR` for Brazilian Portuguese, `zh` for Simplified and `zh-TW` for Traditional Chinese.
  The source language is detected. If the user did not name a target language, ask.
- **API key:** the plugin asked for it when it was installed. If a tool says the key is missing or
  rejected, the user creates one at https://pagetranslate.ai/dashboard/api-keys and updates the plugin's settings.
- **Price:** uploading is free and returns the exact price. Nothing is charged until the user pays.
- **Limits:** PDF, DOCX, EPUB, PNG, JPG, WEBP, TIFF, BMP, GIF. Up to 100 MB and 1,000 PDF pages.

## Steps

Use the `pagetranslate` MCP tools.

1. **Upload:** `upload_document` with the file's absolute path and the target language. It returns
   `job_id`, `word_count`, `price` and `next_step`.
2. **Tell the user the price and get a yes.** Then:
   - If the response has a `payment_url`, give the user that link. They pay by card in the browser,
     and the translation starts by itself.
   - If the price is `0.00` (covered by the account's word balance), call `start_translation`.
3. **Wait:** call `get_translation` about every 30 seconds until `status` is `completed`. If
   `status` is `failed`, tell the user the reason given.
4. **Download:** `download_translation` with `output_dir` set to the source file's folder. It never
   overwrites a file. Tell the user the saved path.

`list_translations` shows earlier jobs, for example to download one again.

## PDF notes

- The result is a PDF. Do not extract the text and translate it yourself; that loses the layout.
- A PDF with no selectable text is a scan. PageTranslate reads it with OCR. Scans in Chinese, Japanese, Korean, Arabic, Hebrew, Hindi or Thai are refused; see the scanned PDF guide below.
- The saved file keeps the service's name for it (for example `job-<id>-es.pdf`). Tell the user the path.

## Problems

- **401:** the key is missing or revoked. Ask the user to create a new one.
- **429 on upload:** uploads are rate limited per account. Wait, do not retry in a loop.
- **"Unsupported language code":** use one of the codes above.
- **Stuck at `pending`:** the job is unpaid. Give the user the payment link again.

## Links

- Online version: [PageTranslate PDF translator](https://pagetranslate.ai/pdf-translator)
- Long files: [translate a large PDF](https://pagetranslate.ai/pdf-translator/translate-large-pdf)
- Scans: [how to translate a scanned PDF](https://pagetranslate.ai/faq/how-to-translate-scanned-pdf)
- Language pairs: [Chinese to English PDF converter](https://pagetranslate.ai/pdf-translator/chinese-to-english-pdf-converter)
- Comparison: [DeepL alternative for PDFs](https://pagetranslate.ai/blog/deepl-alternative)
- Source and docs: [GitHub](https://github.com/Caravaca-Labs/pagetranslate-mcp) · [npm](https://www.npmjs.com/package/pagetranslate-mcp) · [PageTranslate](https://pagetranslate.ai)

## Safety

- Uploading sends the file to PageTranslate. Upload only the file the user asked to translate.
- Never print the API key or write it to a file.
- Do not say a translation is running until `payment_status` is `paid`.
- Never pay, or enter card details, for the user. Payment is theirs to make in the browser.
