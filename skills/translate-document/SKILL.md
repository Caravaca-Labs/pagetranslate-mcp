---
name: translate-document
description: Translate a whole PDF, scanned PDF, DOCX, EPUB or image file into another language with PageTranslate and get back a file with the original layout. Use when the user wants a document, book, ebook, manual, contract or scan translated as a file, not just a passage of pasted text.
license: MIT
compatibility: Needs network access and a PageTranslate API key (PAGETRANSLATE_API_KEY). Works with the pagetranslate MCP server or plain curl.
metadata:
  author: PageTranslate
  homepage: https://pagetranslate.ai
---

# Translate a document with PageTranslate

PageTranslate (https://pagetranslate.ai) translates a whole file and returns the same kind of file:
a PDF comes back as a PDF with its pages, fonts, tables and images in place; a DOCX as a DOCX; an
EPUB as an EPUB. Scanned PDFs and photos are read with OCR first. Use it when the user wants the
document itself translated. For a sentence or a paragraph, translate it yourself.

## Before you start

- **Formats:** PDF, DOCX, EPUB, PNG, JPG, WEBP, TIFF, BMP, GIF. Up to 100 MB and 1,000 PDF pages.
- **Target language:** a code such as `es`, `fr`, `de`, `it`, `ja`, `ko`, `ar`, `hi`, `ru`.
  Use `pt-BR` for Brazilian Portuguese, `zh` for Simplified and `zh-TW` for Traditional Chinese.
  The source language is detected. If the user did not name a target language, ask.
- **API key:** the user creates one at https://pagetranslate.ai/dashboard/api-keys (free account, verified email) and sets it as
  `PAGETRANSLATE_API_KEY`. Never print the key or put it in a file.
- **Price:** uploading is free and returns the exact price. Nothing is charged until the user pays.

## Steps

Use the `pagetranslate` MCP tools when they are available. Otherwise use curl (next section).

1. **Upload:** `upload_document` with the file's absolute path and the target language. It returns
   `job_id`, `word_count`, `price` and `next_step`.
2. **Tell the user the price and get a yes.** Then:
   - If the response has a `payment_url`, give the user that link. They pay by card in the browser,
     and the translation starts by itself. Do not say it is running until `payment_status` is `paid`.
   - If the price is `0.00` (covered by the account's word balance), call `start_translation`.
3. **Wait:** call `get_translation` about every 30 seconds until `status` is `completed`. A short
   document takes a minute or two; a book can take much longer. Tell the user if `status` is
   `failed`, with the reason given.
4. **Download:** `download_translation` with `output_dir` set to the source file's folder. It never
   overwrites a file. Tell the user the saved path.

`list_translations` shows earlier jobs, for example to download one again.

## Without the MCP server

Same steps over HTTPS. Every request carries `Authorization: Bearer $PAGETRANSLATE_API_KEY`.

```bash
API=https://api.pagetranslate.ai/api/v1

# 1. Upload (free). The response has job_id and quote.total_cents.
curl -sS -X POST "$API/upload/" -H "Authorization: Bearer $PAGETRANSLATE_API_KEY" \
  -F "file=@/path/to/book.pdf" -F "requested_language=es"

# 2. Start from the account's word balance. A 400 "Insufficient credits" means the user
#    pays by card at https://pagetranslate.ai/dashboard?resume=JOB_ID#upload instead.
curl -sS -X POST "$API/jobs/JOB_ID/translate" -H "Authorization: Bearer $PAGETRANSLATE_API_KEY" \
  -H "Content-Type: application/json" -d '{}'

# 3. Poll until "status" is "completed" ("payment_status" shows whether it was paid).
curl -sS "$API/jobs/JOB_ID" -H "Authorization: Bearer $PAGETRANSLATE_API_KEY"

# 4. Download. -OJ keeps the server's file name; run it in the folder to save into.
curl -sS -OJ "$API/jobs/JOB_ID/download" -H "Authorization: Bearer $PAGETRANSLATE_API_KEY"
```

## Problems

- **401:** the key is missing or revoked. Ask the user to create a new one.
- **429 on upload:** uploads are rate limited per account. Wait, do not retry in a loop.
- **"Unsupported language code":** use one of the codes above, or see https://pagetranslate.ai for the list.
- **Stuck at `pending`:** the job is unpaid. Give the user the payment link again.
