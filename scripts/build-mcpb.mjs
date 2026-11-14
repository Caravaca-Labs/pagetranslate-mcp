// Builds the Claude Desktop bundle, dist-mcpb/pagetranslate.mcpb: a double-click install that asks
// for the API key. It wraps the PUBLISHED npm package (with its node_modules), so publish to npm
// first, then run:
//
//   npm i -g @anthropic-ai/mcpb   # once
//   node scripts/build-mcpb.mjs
//
// Attach the output to the GitHub release for that version.
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const staging = path.resolve("dist-mcpb/staging");
const output = path.resolve("dist-mcpb/pagetranslate.mcpb");
const entry = "node_modules/pagetranslate-mcp/index.js";

rmSync("dist-mcpb", { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
copyFileSync(".claude-plugin/icon.png", path.join(staging, "icon.png"));
writeFileSync(
    path.join(staging, "package.json"),
    JSON.stringify({ name: "pagetranslate-mcpb-staging", private: true, dependencies: { [pkg.name]: pkg.version } }, null, 2),
);
writeFileSync(
    path.join(staging, "manifest.json"),
    JSON.stringify(
        {
            manifest_version: "0.3",
            name: "pagetranslate",
            display_name: "PageTranslate",
            version: pkg.version,
            description: "Translate PDF, scanned PDF, DOCX and EPUB files into 70+ languages with the layout kept.",
            long_description:
                "PDF translator and document translator for Claude. Name a file on your computer and a language; PageTranslate " +
                "translates the whole document and returns the same kind of file: a PDF with its pages, tables and images in " +
                "place, a DOCX that is still a DOCX, an EPUB that is still an EPUB. Scanned PDFs and photos are read with OCR. " +
                "Uploading is free and returns the exact price; Claude cannot spend money, you pay in your browser. " +
                "From the makers of https://pagetranslate.ai",
            author: { name: "Caravaca Labs", url: "https://pagetranslate.ai" },
            homepage: "https://pagetranslate.ai",
            documentation: "https://github.com/Caravaca-Labs/pagetranslate-mcp#readme",
            support: "https://github.com/Caravaca-Labs/pagetranslate-mcp/issues",
            repository: { type: "git", url: "https://github.com/Caravaca-Labs/pagetranslate-mcp" },
            license: "MIT",
            icon: "icon.png",
            keywords: ["translation", "pdf-translator", "document-translator", "epub-translator", "book-translation", "ocr"],
            server: {
                type: "node",
                entry_point: entry,
                mcp_config: {
                    command: "node",
                    args: [`\${__dirname}/${entry}`],
                    env: { PAGETRANSLATE_API_KEY: "${user_config.api_key}" },
                },
            },
            tools: [
                { name: "upload_document", description: "Upload a local file and get the exact price to translate it. Free." },
                { name: "start_translation", description: "Start a job from the account's word balance, or get the payment link." },
                { name: "get_translation", description: "Status, progress and payment state of one job." },
                { name: "list_translations", description: "Recent jobs on the account." },
                { name: "download_translation", description: "Save the finished file to a folder." },
            ],
            user_config: {
                api_key: {
                    type: "string",
                    title: "PageTranslate API key",
                    description: "Create one at https://pagetranslate.ai/dashboard/api-keys (free account, verified email).",
                    sensitive: true,
                    required: true,
                },
            },
            compatibility: { platforms: ["darwin", "win32", "linux"], runtimes: { node: pkg.engines.node } },
        },
        null,
        2,
    ),
);

execSync("npm install --omit=dev --no-fund --no-audit", { cwd: staging, stdio: "inherit" });
execSync("mcpb validate manifest.json", { cwd: staging, stdio: "inherit" });
execSync(`mcpb pack . ${JSON.stringify(output)}`, { cwd: staging, stdio: "inherit" });
console.log(`\nBuilt ${output} (${pkg.name}@${pkg.version})`);
