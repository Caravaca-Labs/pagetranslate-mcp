<!--
Keyword rationale (DataForSEO Google Ads, US, 2026-11-13):
  pdf translator / translate pdf 4,400/mo · document translator / translate document 3,600/mo
  MCP modifiers ("translation mcp", "pdf translator mcp", "document translation mcp") have no
  measurable volume. The surfaces that matter are each MCP directory's own search, GitHub search,
  npm search, skills.sh and ClawHub, all of which read the repo description, package.json
  description/keywords, server.json description, each SKILL.md description and the README H1/H2s.
Contiguous phrases to keep intact: "PDF translator", "document translator", "EPUB translator",
  "translate a PDF", "translate a book", "scanned PDF", "MCP server", "Agent Skills".
Deep links (keyword targets of 2026-11-12, plus Search Console 2026-10-14 to 2026-11-11 as
  clicks/impressions): /pdf-translator · /epub-translator (6/35) · /translate-a-book ·
  /document-translation-software · /docx-translator · /translate-a-book/ai-novel-translator (2/46) ·
  /pdf-translator/translate-large-pdf (5/166) · /faq/how-much-does-it-cost-to-translate-a-book (1/89) ·
  /tools/translation-cost-calculator (9/1,261) · /faq/how-to-translate-scanned-pdf ·
  /blog/how-to-open-epub-on-kindle (5/382) ·
  /document-translation-software/translation-software-for-legal-documents ·
  /document-translation-software/google-translate-english-to-spanish-documents (2/1,132).
  Anchor text is each page's own title. Every link in this file and in skills/ returned 200 on
  2026-11-13; re-check them when a page moves. The skills' links come from scripts/build-skills.mjs.
Banned claims (not shipped): XLSX, PPTX, subtitles or video; "free translation" (only the upload
  and the quote are free); more than "70+ languages" (the API accepts 74 codes); human or
  certified translation; glossaries or translation memory; translating pasted text (files only).
Prices and limits below mirror https://api.pagetranslate.ai/api/v1/pricing/catalog/public
  (8¢ per 1,000 words, $3.99 minimum, Pro $10/month for 500,000 words, 1,000 PDF pages).
  Re-check them when pricing changes.
-->

# PageTranslate MCP server: a PDF translator and document translator for AI agents

[![npm package](https://img.shields.io/npm/v/pagetranslate-mcp?label=npm)](https://www.npmjs.com/package/pagetranslate-mcp)
[![Pi package](https://img.shields.io/badge/Pi-package-3B82F6)](https://pi.dev/packages?search=pagetranslate)
[![Agent skills](https://img.shields.io/badge/agent_skills-SKILL.md-0F766E)](#agent-skills)
[![skills.sh](https://skills.sh/b/caravaca-labs/pagetranslate-mcp)](https://skills.sh/caravaca-labs/pagetranslate-mcp)
[![PageTranslate MCP server on Glama](https://glama.ai/mcp/servers/Caravaca-Labs/pagetranslate-mcp/badges/score.svg)](https://glama.ai/mcp/servers/Caravaca-Labs/pagetranslate-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

Ask your agent to translate a PDF and you usually get the words back in a chat window. The pages,
tables, footnotes and images are gone, and a scanned PDF may not be readable at all.

PageTranslate MCP gives the agent a document translator. It sends the file to
[PageTranslate](https://pagetranslate.ai), which translates the whole document into any of 70+
languages and rebuilds it in the original layout. A PDF comes back as a PDF, a DOCX as a DOCX, an
EPUB as an EPUB.

You say "translate contract.pdf into German", approve the price, and the German PDF is saved next
to the original.

- **Files:** PDF, scanned PDF, DOCX, EPUB, and images (PNG, JPG, WEBP, TIFF, BMP, GIF). Up to 100 MB and 1,000 PDF pages.
- **Scans and photos** are read with OCR, then translated onto the page. See [how to translate a scanned PDF](https://pagetranslate.ai/faq/how-to-translate-scanned-pdf).
- **Whole books:** a 150,000-word novel is one upload, not 300 chat messages. It works the same way as the [EPUB translator](https://pagetranslate.ai/epub-translator) on the site.
- **The price comes first.** Uploading is free and returns the exact price. The agent cannot spend money: you pay in your browser, or the job runs on words you already bought.

The package ships an MCP server and four Agent Skills, for Claude Code, Claude Desktop, Cursor,
Codex, Gemini CLI, Pi, Hermes, OpenClaw and other agents. From the makers of
[pagetranslate.ai](https://pagetranslate.ai).

## Set up

1. Create a free account at [pagetranslate.ai](https://pagetranslate.ai/signup), verify your email, and
   create an API key under [Dashboard → API Keys](https://pagetranslate.ai/dashboard/api-keys).
2. Add the server to your client. It needs Node.js 20 or newer.

**Claude Code**

```bash
claude mcp add pagetranslate -e PAGETRANSLATE_API_KEY=pt_live_YOUR_KEY -- npx -y pagetranslate-mcp
```

Or install it as a plugin, which adds the skills too:

```
/plugin marketplace add Caravaca-Labs/pagetranslate-mcp
/plugin install pagetranslate@pagetranslate
```

**Codex**

```bash
codex mcp add pagetranslate --env PAGETRANSLATE_API_KEY=pt_live_YOUR_KEY -- npx -y pagetranslate-mcp
```

**Gemini CLI**

```bash
gemini mcp add pagetranslate npx -e PAGETRANSLATE_API_KEY=pt_live_YOUR_KEY -- -y pagetranslate-mcp
```

**Claude Desktop, Cursor, VS Code, Windsurf, Cline and other clients** take this block in their MCP settings file:

```json
{
  "mcpServers": {
    "pagetranslate": {
      "command": "npx",
      "args": ["-y", "pagetranslate-mcp"],
      "env": { "PAGETRANSLATE_API_KEY": "pt_live_YOUR_KEY" }
    }
  }
}
```

**Claude Desktop, without a config file:** download
[`pagetranslate.mcpb`](https://github.com/Caravaca-Labs/pagetranslate-mcp/releases/latest/download/pagetranslate.mcpb)
and open it. Claude Desktop asks for your API key and installs the server.

Then ask: *"Translate /Users/me/Documents/manual.pdf into Spanish."*

## What a translation costs

8¢ per 1,000 words, with a $3.99 minimum per document. A 20,000-word report is $3.99; an
80,000-word novel is $6.40. The Pro plan is $10 a month for 500,000 words. The site explains
[how much it costs to translate a book](https://pagetranslate.ai/faq/how-much-does-it-cost-to-translate-a-book)
and has a [translation cost calculator](https://pagetranslate.ai/tools/translation-cost-calculator).

`upload_document` is free and returns the exact price for that file. If your account's word balance
covers it, the agent can start it. If not, the agent gives you a payment link, you pay by card on
pagetranslate.ai, and the translation starts by itself.

## Tools

| Tool | What it does |
| --- | --- |
| `upload_document` | Uploads a local file and returns the job id, word count, exact price and next step. Free. |
| `start_translation` | Starts a job from the account's word balance. Without a balance it charges nothing and returns the payment link. |
| `get_translation` | Status, progress and payment state of one job. |
| `list_translations` | Recent jobs on the account. |
| `download_translation` | Saves the finished file to a folder. Never overwrites an existing file. |

## Agent skills

Four [Agent Skills](https://agentskills.io) ship in `skills/` and inside the npm package. Each
teaches an agent the whole flow for one kind of file: ask for the target language, show the price,
wait for payment, poll, download. They use the MCP tools when those are installed and plain `curl`
when they are not, so they also work in agents that have no MCP support.

| Skill | Use it for | Online version |
| --- | --- | --- |
| [`pagetranslate-pdf-translator`](skills/pagetranslate-pdf-translator/SKILL.md) | PDFs, with the layout kept | [PDF translator](https://pagetranslate.ai/pdf-translator) |
| [`pagetranslate-scanned-pdf-translator`](skills/pagetranslate-scanned-pdf-translator/SKILL.md) | Scanned PDFs and photos of pages | [How to translate a scanned PDF](https://pagetranslate.ai/faq/how-to-translate-scanned-pdf) |
| [`pagetranslate-book-translator`](skills/pagetranslate-book-translator/SKILL.md) | EPUBs, novels and manuscripts | [Translate a book](https://pagetranslate.ai/translate-a-book) |
| [`pagetranslate-document-translator`](skills/pagetranslate-document-translator/SKILL.md) | Word documents and business files | [Document translation software](https://pagetranslate.ai/document-translation-software) |

Claude Code, Cursor, Codex and other [skills.sh](https://skills.sh) agents install them from GitHub:

```bash
npx skills add Caravaca-Labs/pagetranslate-mcp --skill '*' --yes
```

Pi loads them straight from npm:

```bash
pi install npm:pagetranslate-mcp
```

Hermes installs one skill at a time from the repository:

```bash
hermes skills install Caravaca-Labs/pagetranslate-mcp/skills/pagetranslate-pdf-translator
```

OpenClaw installs them from [ClawHub](https://clawhub.ai):

```bash
clawhub install pagetranslate-pdf-translator
```

Each skill's frontmatter carries `openclaw` and `hermes` metadata (the `curl` binary, the
`PAGETRANSLATE_API_KEY` variable, tags) next to the standard fields.

## Online versions

Prefer a browser?

- [PageTranslate PDF translator](https://pagetranslate.ai/pdf-translator)
- [PageTranslate EPUB translator](https://pagetranslate.ai/epub-translator)
- [PageTranslate DOCX translator](https://pagetranslate.ai/docx-translator)
- [Translate a book](https://pagetranslate.ai/translate-a-book)
- [Document translation software](https://pagetranslate.ai/document-translation-software)
- [AI novel translator](https://pagetranslate.ai/translate-a-book/ai-novel-translator)
- [Translate a large PDF](https://pagetranslate.ai/pdf-translator/translate-large-pdf)

Guides and free tools:

- [How much does it cost to translate a book](https://pagetranslate.ai/faq/how-much-does-it-cost-to-translate-a-book)
- [Translation cost calculator](https://pagetranslate.ai/tools/translation-cost-calculator)
- [How to translate a scanned PDF](https://pagetranslate.ai/faq/how-to-translate-scanned-pdf)
- [How to open EPUB on Kindle](https://pagetranslate.ai/blog/how-to-open-epub-on-kindle)
- [Translation software for legal documents](https://pagetranslate.ai/document-translation-software/translation-software-for-legal-documents)
- [Translate English to Spanish documents](https://pagetranslate.ai/document-translation-software/google-translate-english-to-spanish-documents)
- [EPUB merger](https://pagetranslate.ai/tools/epub-merger) and other [free tools for authors](https://pagetranslate.ai/tools)

## Registries

The server is published as
[`io.github.catorch/pagetranslate-mcp`](https://registry.modelcontextprotocol.io/v0/servers?search=pagetranslate)
in the official MCP Registry and on npm as
[`pagetranslate-mcp`](https://www.npmjs.com/package/pagetranslate-mcp). The skills are on
[skills.sh](https://www.skills.sh/caravaca-labs/pagetranslate-mcp) and, for OpenClaw, on
[ClawHub](https://clawhub.ai). [Glama](https://glama.ai/mcp/servers/Caravaca-Labs/pagetranslate-mcp)
builds and scores the server.

## Configuration

| Variable | Required | Meaning |
| --- | --- | --- |
| `PAGETRANSLATE_API_KEY` | yes | Your key, `pt_live_...`. |
| `PAGETRANSLATE_API_URL` | no | API origin. Default `https://api.pagetranslate.ai`. |

## Privacy

The server runs on your computer. It reads only the file you name and writes only the file you
download. Your API key and documents go to PageTranslate's API over HTTPS, under your own account,
and nowhere else. There is no telemetry. What PageTranslate does with uploaded documents is in its
[privacy policy](https://pagetranslate.ai/privacy).

## Support

Problems with this server: [open an issue](https://github.com/Caravaca-Labs/pagetranslate-mcp/issues).
Questions about a translation, a payment or your account: [pagetranslate.ai/contact](https://pagetranslate.ai/contact).

## Development

```bash
npm install
PAGETRANSLATE_API_KEY=pt_live_... E2E_EXPECT=payment npm test
```

`npm test` runs `test/e2e.mjs`: a real MCP client drives the server over stdio against the real
API and writes every tool call to `test-artifacts/<time>/transcript.json`. `E2E_EXPECT=payment` is
for an account with no word balance: the job must stop at a payment link, so nothing is charged.
`E2E_EXPECT=completed` is for an account whose balance covers the 56-word sample: it must
translate, download, and match the API's file byte for byte.

The four skills are generated from `scripts/build-skills.mjs`; edit that file, not the `SKILL.md`
files. `npm version <patch|minor>` rebuilds them and updates the version in every manifest.
`node scripts/build-mcpb.mjs` builds the Claude Desktop bundle from the published npm package.

## License

MIT
