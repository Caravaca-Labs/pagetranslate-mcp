<!--
Keyword rationale (DataForSEO Google Ads, US, 2026-11-13):
  pdf translator / translate pdf 4,400/mo · document translator / translate document 3,600/mo
  MCP modifiers ("translation mcp", "pdf translator mcp", "document translation mcp") have no
  measurable volume. The surfaces that matter are each MCP directory's own search, GitHub search,
  npm search and skills.sh, all of which read the repo description, package.json
  description/keywords, server.json description, SKILL.md description and the README H1/H2s.
Contiguous phrases to keep intact: "PDF translator", "document translator", "translate a PDF",
  "scanned PDF", "MCP server", "Agent Skill".
Banned claims (not shipped): XLSX, PPTX, subtitles or video; "free translation" (only the upload
  and the quote are free); more than "70+ languages" (the API accepts 74 codes); human or
  certified translation; glossaries or translation memory; translating pasted text (files only).
Prices and limits below mirror https://api.pagetranslate.ai/api/v1/pricing/catalog/public
  (8¢ per 1,000 words, $3.99 minimum, Pro $10/month for 500,000 words, 1,000 PDF pages).
  Re-check them when pricing changes.
-->

# PageTranslate MCP server: a PDF translator and document translator for AI agents

[![npm package](https://img.shields.io/npm/v/pagetranslate-mcp?label=npm)](https://www.npmjs.com/package/pagetranslate-mcp)
[![Agent skill](https://img.shields.io/badge/agent_skill-SKILL.md-0F766E)](./skills/translate-document/SKILL.md)
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
- **Scans and photos** are read with OCR, then translated onto the page.
- **Whole books:** a 150,000-word novel is one upload, not 300 chat messages.
- **The price comes first.** Uploading is free and returns the exact price. The agent cannot spend money: you pay in your browser, or the job runs on words you already bought.

From the makers of [pagetranslate.ai](https://pagetranslate.ai).

## Set up

1. Create a free account at [pagetranslate.ai](https://pagetranslate.ai/signup), verify your email, and
   create an API key under [Dashboard → API Keys](https://pagetranslate.ai/dashboard/api-keys).
2. Add the server to your client. It needs Node.js 20 or newer.

**Claude Code**

```bash
claude mcp add pagetranslate -e PAGETRANSLATE_API_KEY=pt_live_YOUR_KEY -- npx -y pagetranslate-mcp
```

Or install it as a plugin, which adds the skill too:

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

Then ask: *"Translate /Users/me/Documents/manual.pdf into Spanish."*

## What a translation costs

8¢ per 1,000 words, with a $3.99 minimum per document. A 20,000-word report is $3.99; an
80,000-word novel is $6.40. The Pro plan is $10 a month for 500,000 words. Current prices are on
[pagetranslate.ai](https://pagetranslate.ai).

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

## Agent Skill

`skills/translate-document` is an [Agent Skill](https://agentskills.io) that teaches an agent the
whole flow: ask for the target language, show the price, wait for payment, poll, download. It uses
the MCP tools when they are installed and plain `curl` when they are not.

```bash
npx skills add Caravaca-Labs/pagetranslate-mcp
```

The MCP server also serves the skill to clients that read skills over MCP.

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

`npm version <patch|minor>` updates the version in every manifest.

## License

MIT
