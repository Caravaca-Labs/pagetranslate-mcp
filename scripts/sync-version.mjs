// Runs on `npm version`: copies package.json's version into every manifest that repeats it.
import { readFileSync, writeFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
for (const file of ["server.json", ".claude-plugin/plugin.json", ".cursor-plugin/plugin.json", "gemini-extension.json"]) {
    const text = readFileSync(file, "utf8");
    writeFileSync(file, text.replace(/("version": ")[^"]+/g, `$1${version}`).replace(/(pagetranslate-mcp@)[^"]+/g, `$1${version}`));
}
