// Writes skills/<name>/SKILL.md for every skill below from one shared flow, so the four never drift.
// Runs on `npm version` and by hand: node scripts/build-skills.mjs
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const SITE = "https://pagetranslate.ai";
const REPO = "https://github.com/Caravaca-Labs/pagetranslate-mcp";

const SKILLS = [
    {
        name: "pagetranslate-pdf-translator",
        title: "PageTranslate PDF Translator",
        description:
            "Use this skill whenever the user wants a PDF translated into another language and returned as a PDF with its pages, tables, fonts and images in place: manuals, contracts, reports, papers, brochures, large PDFs. Uploads the file to PageTranslate, shows the exact price first, and downloads the translated PDF.",
        homepage: `${SITE}/pdf-translator`,
        tags: ["translation", "pdf", "pdf-translator", "translate-pdf", "pagetranslate"],
        intro: "Translate a PDF with PageTranslate and get a PDF back: the same pages, tables, fonts and images, in the new language.",
        when: [
            "The user names a `.pdf` file and a language, or asks to translate a PDF.",
            "The layout matters: tables, columns, figures, page numbers, headers and footers.",
            "The PDF is long. One file can have up to 1,000 pages and 100 MB.",
        ],
        notesTitle: "PDF notes",
        notes: [
            "The result is a PDF. Do not extract the text and translate it yourself; that loses the layout.",
            "A PDF with no selectable text is a scan. PageTranslate reads it with OCR. Scans in Chinese, Japanese, Korean, Arabic, Hebrew, Hindi or Thai are refused; see the scanned PDF guide below.",
            "The saved file keeps the service's name for it (for example `job-<id>-es.pdf`). Tell the user the path.",
        ],
        links: [
            ["Online version", "PageTranslate PDF translator", "/pdf-translator"],
            ["Long files", "translate a large PDF", "/pdf-translator/translate-large-pdf"],
            ["Scans", "how to translate a scanned PDF", "/faq/how-to-translate-scanned-pdf"],
            ["Language pairs", "Chinese to English PDF converter", "/pdf-translator/chinese-to-english-pdf-converter"],
            ["Comparison", "DeepL alternative for PDFs", "/blog/deepl-alternative"],
        ],
    },
    {
        name: "pagetranslate-scanned-pdf-translator",
        title: "PageTranslate Scanned PDF Translator",
        description:
            "Use this skill whenever the user wants a scanned PDF, a photographed page or an image of text (PNG, JPG, WEBP, TIFF) translated. PageTranslate reads the scan with OCR, translates it and puts the translation back on the page, so the result is still a PDF or image, not loose text.",
        homepage: `${SITE}/faq/how-to-translate-scanned-pdf`,
        tags: ["translation", "ocr", "scanned-pdf", "image-translation", "pagetranslate"],
        intro: "Translate a scanned PDF or a photo of a page. PageTranslate reads it with OCR, translates it, and puts the translation back on the page.",
        when: [
            "The PDF has no selectable text: a scan, a fax, a photographed book or form.",
            "The file is an image of text: PNG, JPG, WEBP, TIFF, BMP or GIF.",
            "You tried to read the PDF's text and got nothing, or only fragments.",
        ],
        notesTitle: "Scan notes",
        notes: [
            "A scan's price comes from a sample of its pages. That price is locked: it is what the user pays.",
            "Scans in Latin-script languages (English, Spanish, French, German, Portuguese and so on) work. A scan in Chinese, Japanese, Korean, Arabic, Hebrew, Hindi or Thai, or one too faint to read, is refused with a message. Do not retry it.",
            "For a refused Chinese, Japanese or Korean scan, the fix is an OCR tool that adds a text layer to the PDF. Then upload that PDF.",
            "A scan takes longer than a text PDF, because OCR runs first. Keep polling; do not upload it again.",
        ],
        links: [
            ["Guide", "how to translate a scanned PDF", "/faq/how-to-translate-scanned-pdf"],
            ["Online version", "PageTranslate PDF translator", "/pdf-translator"],
            ["Making scans", "how to turn a scanned document into a PDF", "/blog/how-to-turn-a-scanned-document-into-a-pdf"],
            ["Text layers", "how to make a PDF file searchable", "/blog/how-to-make-a-pdf-file-searchable"],
            ["Many files", "batch OCR for PDFs", "/blog/batch-ocr-pdf"],
        ],
    },
    {
        name: "pagetranslate-book-translator",
        title: "PageTranslate Book Translator",
        description:
            "Use this skill whenever the user wants a whole book translated: an EPUB ebook, a novel or manuscript in DOCX, or a book-length PDF. One upload returns one translated file in the same format, so an EPUB stays an EPUB. Shows the exact price for the full word count before anything is charged.",
        homepage: `${SITE}/translate-a-book`,
        tags: ["translation", "book-translation", "epub", "epub-translator", "novel", "pagetranslate"],
        intro: "Translate a whole book with PageTranslate: an EPUB, a DOCX manuscript or a PDF. One upload, one translated file in the same format.",
        when: [
            "The user wants a novel, ebook, manuscript or textbook translated.",
            "The file is an `.epub`, or a book-length `.docx` or `.pdf`.",
            "The book is too long to translate in the conversation.",
        ],
        notesTitle: "Book notes",
        notes: [
            "The price follows the word count: about 8¢ per 1,000 words, so an 80,000-word novel is about $6.40. The upload returns the exact price; quote that, not this estimate.",
            "A book takes much longer than a short document. Poll every 30 to 60 seconds and do not upload it again.",
            "An EPUB comes back as an EPUB with its chapters and table of contents. To read it on a Kindle, see the guide below.",
            "Ask which variety of the language the user wants when it matters: `pt` or `pt-BR`, `zh` or `zh-TW`.",
        ],
        links: [
            ["Online version", "translate a book with PageTranslate", "/translate-a-book"],
            ["Ebooks", "EPUB translator", "/epub-translator"],
            ["Fiction", "AI novel translator", "/translate-a-book/ai-novel-translator"],
            ["Spanish editions", "translate my book to Spanish", "/translate-a-book/translate-my-book-to-spanish"],
            ["Pricing", "how much does it cost to translate a book", "/faq/how-much-does-it-cost-to-translate-a-book"],
            ["Estimates", "translation cost calculator", "/tools/translation-cost-calculator"],
            ["Reading", "how to open EPUB on Kindle", "/blog/how-to-open-epub-on-kindle"],
        ],
    },
    {
        name: "pagetranslate-document-translator",
        title: "PageTranslate Document Translator",
        description:
            "Use this skill whenever the user wants a Word document or business file translated and returned as the same kind of file: DOCX contracts, manuals, HR policies, marketing material, financial reports, CVs. Keeps headings, tables, lists and images. Shows the exact price first.",
        homepage: `${SITE}/document-translation-software`,
        tags: ["translation", "document-translation", "docx", "word", "document-translator", "pagetranslate"],
        intro: "Translate a Word document or business file with PageTranslate: a DOCX comes back as a DOCX, with its headings, tables, lists and images.",
        when: [
            "The user names a `.docx` file, or a business document in PDF, and a language.",
            "The document must stay editable or keep its formatting: contracts, manuals, policies, reports, CVs.",
            "Several documents need the same treatment. Upload them one at a time.",
        ],
        notesTitle: "Document notes",
        notes: [
            "Old `.doc` files are not accepted. Ask the user to save the file as `.docx` first.",
            "This is an AI translation for working and reference use. It is not a certified translation. If the user needs one for immigration, a court or a government office, say so.",
            "Uploads are rate limited per account. For a folder of files, upload, quote and confirm each one in turn.",
        ],
        links: [
            ["Online version", "document translation software", "/document-translation-software"],
            ["Word files", "DOCX translator", "/docx-translator"],
            ["Guide", "how to translate a Word document", "/faq/how-to-translate-word-document"],
            ["Legal", "translation software for legal documents", "/document-translation-software/translation-software-for-legal-documents"],
            ["Manuals", "manufacturing document translations", "/document-translation-software/manufacturing-document-translations"],
            ["English and Spanish", "translate English to Spanish documents", "/document-translation-software/google-translate-english-to-spanish-documents"],
            ["Resumes", "CV translator", "/docx-translator/cv-translator"],
        ],
    },
];

const list = (items) => items.map((item) => `- ${item}`).join("\n");
const yamlList = (items) => `[${items.map((item) => JSON.stringify(item)).join(", ")}]`;

const render = (skill) => `---
name: ${skill.name}
description: ${JSON.stringify(skill.description)}
version: ${version}
author: Caravaca Labs
license: MIT
homepage: ${skill.homepage}
compatibility: Needs network access, curl and a PageTranslate API key in PAGETRANSLATE_API_KEY. Uses the pagetranslate MCP tools when they are installed.
required_environment_variables:
  - name: PAGETRANSLATE_API_KEY
    prompt: "PageTranslate API key"
    help: "Create one at ${SITE}/dashboard/api-keys (free account, verified email)"
    required_for: "Uploading documents and downloading translations"
metadata:
  openclaw:
    homepage: ${skill.homepage}
    tags: ${yamlList(skill.tags)}
    requires:
      bins: ["curl"]
      env: ["PAGETRANSLATE_API_KEY"]
    primaryEnv: PAGETRANSLATE_API_KEY
  hermes:
    tags: ${yamlList(skill.tags)}
    category: productivity
    requires_toolsets: ["terminal"]
---

# ${skill.title}

${skill.intro}

[PageTranslate](${SITE}) translates the file itself, not pasted text. For a sentence or a
paragraph, translate it yourself.

## When to use

${list(skill.when)}

## Before you start

- **Target language:** a code such as \`es\`, \`fr\`, \`de\`, \`it\`, \`ja\`, \`ko\`, \`ar\`, \`hi\`, \`ru\`.
  Use \`pt-BR\` for Brazilian Portuguese, \`zh\` for Simplified and \`zh-TW\` for Traditional Chinese.
  The source language is detected. If the user did not name a target language, ask.
- **API key:** the user creates one at ${SITE}/dashboard/api-keys (free account, verified
  email) and sets it as \`PAGETRANSLATE_API_KEY\`.
- **Price:** uploading is free and returns the exact price. Nothing is charged until the user pays.
- **Limits:** PDF, DOCX, EPUB, PNG, JPG, WEBP, TIFF, BMP, GIF. Up to 100 MB and 1,000 PDF pages.

## Steps

Use the \`pagetranslate\` MCP tools when they are available. Otherwise use curl (next section).

1. **Upload:** \`upload_document\` with the file's absolute path and the target language. It returns
   \`job_id\`, \`word_count\`, \`price\` and \`next_step\`.
2. **Tell the user the price and get a yes.** Then:
   - If the response has a \`payment_url\`, give the user that link. They pay by card in the browser,
     and the translation starts by itself.
   - If the price is \`0.00\` (covered by the account's word balance), call \`start_translation\`.
3. **Wait:** call \`get_translation\` about every 30 seconds until \`status\` is \`completed\`. If
   \`status\` is \`failed\`, tell the user the reason given.
4. **Download:** \`download_translation\` with \`output_dir\` set to the source file's folder. It never
   overwrites a file. Tell the user the saved path.

\`list_translations\` shows earlier jobs, for example to download one again.

## Without the MCP server

Same steps over HTTPS. Every request carries \`Authorization: Bearer $PAGETRANSLATE_API_KEY\`.

\`\`\`bash
API=https://api.pagetranslate.ai/api/v1

# 1. Upload (free). The response has job_id and quote.total_cents.
curl -sS -X POST "$API/upload/" -H "Authorization: Bearer $PAGETRANSLATE_API_KEY" \\
  -F "file=@/path/to/file" -F "requested_language=es"

# 2. Start from the account's word balance. A 400 "Insufficient credits" means the user
#    pays by card at ${SITE}/dashboard?resume=JOB_ID#upload instead.
curl -sS -X POST "$API/jobs/JOB_ID/translate" -H "Authorization: Bearer $PAGETRANSLATE_API_KEY" \\
  -H "Content-Type: application/json" -d '{}'

# 3. Poll until "status" is "completed" ("payment_status" shows whether it was paid).
curl -sS "$API/jobs/JOB_ID" -H "Authorization: Bearer $PAGETRANSLATE_API_KEY"

# 4. Download. -OJ keeps the server's file name; run it in the folder to save into.
curl -sS -OJ "$API/jobs/JOB_ID/download" -H "Authorization: Bearer $PAGETRANSLATE_API_KEY"
\`\`\`

## ${skill.notesTitle}

${list(skill.notes)}

## Problems

- **401:** the key is missing or revoked. Ask the user to create a new one.
- **429 on upload:** uploads are rate limited per account. Wait, do not retry in a loop.
- **"Unsupported language code":** use one of the codes above.
- **Stuck at \`pending\`:** the job is unpaid. Give the user the payment link again.

## Links

${list(skill.links.map(([label, anchor, path]) => `${label}: [${anchor}](${SITE}${path})`))}
- Source and docs: [GitHub](${REPO}) · [npm](https://www.npmjs.com/package/pagetranslate-mcp) · [PageTranslate](${SITE})

## Safety

- Uploading sends the file to PageTranslate. Upload only the file the user asked to translate.
- Never print the API key or write it to a file.
- Do not say a translation is running until \`payment_status\` is \`paid\`.
- Never pay, or enter card details, for the user. Payment is theirs to make in the browser.
`;

rmSync("skills", { recursive: true, force: true });
for (const skill of SKILLS) {
    mkdirSync(`skills/${skill.name}`, { recursive: true });
    writeFileSync(`skills/${skill.name}/SKILL.md`, render(skill));
}
console.log(`wrote ${SKILLS.length} skills at version ${version}`);
