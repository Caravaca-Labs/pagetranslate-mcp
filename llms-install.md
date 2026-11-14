# Install PageTranslate in Cline

Install only the public `pagetranslate-mcp` npm package from this repository.
Do not install a similarly named package, create a new PageTranslate account for
the user, purchase words, or start a translation during installation.

## Prerequisites

- Node.js 20 or newer and `npx` on the client process's PATH.
- A verified PageTranslate account and a private API key created at
  https://pagetranslate.ai/dashboard/api-keys.
- Cline installed. Its model-provider login is separate from PageTranslate's key.

Before changing configuration, account for these failure cases: missing Node or
`npx`; invalid JSON; an existing server entry or unrelated configuration that must
be preserved; a missing or revoked PageTranslate key; and a restricted network
that cannot reach npm or `https://api.pagetranslate.ai`.

## Configure

Open Cline's MCP server configuration. Merge this entry into its existing
`mcpServers` object without replacing other servers. The CLI uses
`~/.cline/mcp.json`; the editor extension exposes its own configuration through
the MCP Servers panel, so use the file opened by that panel rather than guessing
the extension's profile path.

```json
{
  "mcpServers": {
    "pagetranslate": {
      "command": "npx",
      "args": ["-y", "pagetranslate-mcp@0.1.3"],
      "env": {
        "PAGETRANSLATE_API_KEY": "pt_live_YOUR_KEY"
      }
    }
  }
}
```

Have the user enter the real key privately. Never request it in a public issue,
commit it, print it, or include it in screenshots or exported configuration.
Do not set automatic tool approval or change the user's approval preferences.

## Verify Without Spending Words

Reload the server in Cline and confirm its connected state. Confirm these tools
are available: `upload_document`, `start_translation`, `get_translation`,
`list_translations`, and `download_translation`.

Ask Cline: "Use PageTranslate to list my recent translations. Do not upload,
start, purchase or download anything." A real response may contain an empty jobs
list; do not fabricate a completed translation to make the check appear to pass.

If authentication fails, direct the user to their API-key dashboard. If the
server does not launch, check Node.js, PATH and registry access before retrying.
Preserve a sanitized record of the Cline version, package version, connection
result and read-only tool result. Never include keys, private document names or
temporary download links in a public report.

This installation guide is not itself evidence of a successful Cline run. The
Cline Marketplace's client-specific installation attestation may only be made
after actually observing Cline install the server from this guide or the README.
