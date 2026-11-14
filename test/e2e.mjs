// End-to-end check. Drives the server over stdio with a real MCP client against a real PageTranslate API
// and writes every tool call to <artifact-dir>/transcript.json. Exits 1 when any check fails.
//
//   PAGETRANSLATE_API_KEY=pt_live_... E2E_EXPECT=payment node test/e2e.mjs [artifact-dir]
//
// E2E_EXPECT says what the key's account must reach:
//   payment    the account has no word balance: the job stops at a payment link (no charge is made)
//   completed  the balance covers the job: it is translated, downloaded and compared with the API's own file
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const expect = process.env.E2E_EXPECT;
const apiKey = process.env.PAGETRANSLATE_API_KEY;
if (!apiKey || !["payment", "completed"].includes(expect)) {
    console.error("Set PAGETRANSLATE_API_KEY and E2E_EXPECT=payment|completed");
    process.exit(2);
}
const apiUrl = (process.env.PAGETRANSLATE_API_URL || "https://api.pagetranslate.ai").replace(/\/+$/, "");
const artifacts = path.resolve(process.argv[2] || path.join(root, "test-artifacts", new Date().toISOString().replace(/[:.]/g, "-")));
mkdirSync(artifacts, { recursive: true });

const report = {
    started_at: new Date().toISOString(),
    package_version: JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version,
    api_url: apiUrl,
    expect,
    checks: [],
    calls: [],
};
const save = () => writeFileSync(path.join(artifacts, "transcript.json"), JSON.stringify(report, null, 2));
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

function check(name, passed, evidence) {
    report.checks.push({ name, passed: Boolean(passed), evidence });
    save();
    console.log(`${passed ? "PASS" : "FAIL"}: ${name}`);
}

async function connect(key) {
    const client = new Client({ name: "pagetranslate-mcp-e2e", version: "1.0.0" });
    await client.connect(
        new StdioClientTransport({
            command: process.execPath,
            args: [path.join(root, "index.js")],
            env: { ...process.env, PAGETRANSLATE_API_KEY: key },
        }),
    );
    const call = async (name, args = {}) => {
        const response = await client.callTool({ name, arguments: args });
        const text = response.content?.[0]?.text ?? "";
        const data = response.isError ? null : JSON.parse(text);
        report.calls.push({ tool: name, arguments: args, is_error: Boolean(response.isError), result: data ?? text });
        save();
        return { error: response.isError ? text : null, data };
    };
    return { call, close: () => client.close() };
}

let session;
try {
    const badKey = await connect("pt_live_this_key_does_not_exist");
    const rejected = await badKey.call("list_translations");
    check("a rejected key tells the user where to create one", rejected.error?.includes("/dashboard/api-keys"), rejected.error);
    await badKey.close();

    session = await connect(apiKey);
    const { call } = session;
    const source = path.join(root, "test", "fixtures", "sample.docx");

    const badLanguage = await call("upload_document", { file_path: source, target_language: "klingon" });
    check("an unsupported language is refused with the API's reason", badLanguage.error?.includes("Unsupported language"), badLanguage.error);

    const missing = await call("upload_document", { file_path: path.join(artifacts, "no-such-file.pdf"), target_language: "es" });
    check("a missing file is reported, not uploaded", missing.error?.includes("no-such-file.pdf"), missing.error);

    const { data: uploaded, error: uploadError } = await call("upload_document", { file_path: source, target_language: "es" });
    check(
        "upload returns a job with a word count and an exact price",
        uploaded && /^[0-9a-f]{24}$/.test(uploaded.job_id) && uploaded.word_count > 0 && /^\d+\.\d{2} USD$/.test(uploaded.price),
        uploaded ?? uploadError,
    );
    if (!uploaded) throw new Error("upload failed; later checks need its job");
    const jobId = uploaded.job_id;
    check("upload alone neither pays nor starts", uploaded.status === "pending" && uploaded.payment_status === "pending", uploaded);

    const { data: started, error: startError } = await call("start_translation", { job_id: jobId });
    if (!started) throw new Error(`start_translation failed: ${startError}`);

    if (expect === "payment") {
        check(
            "without a balance the job stops at a payment link for this job",
            started.status === "pending" && started.payment_status === "pending" && started.payment_url?.startsWith("https://") && started.payment_url.includes(jobId),
            started,
        );
        const early = await call("download_translation", { job_id: jobId, output_dir: artifacts });
        check("an unpaid job has nothing to download", Boolean(early.error), early.error);
    } else {
        check("the balance pays and the job leaves pending or is marked paid", started.payment_status === "paid" && !started.payment_url, started);
        const deadline = Date.now() + Number(process.env.E2E_TIMEOUT_S || 180) * 1000;
        let job = started;
        while (job.status !== "completed" && !["failed", "cancelled", "aborted"].includes(job.status) && Date.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            job = (await call("get_translation", { job_id: jobId })).data;
        }
        check("the translation completes", job.status === "completed", job);

        const outDir = path.join(artifacts, "downloads");
        const first = (await call("download_translation", { job_id: jobId, output_dir: outDir })).data;
        const direct = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/download`, { headers: { Authorization: `Bearer ${apiKey}` } });
        const expected = createHash("sha256").update(Buffer.from(await direct.arrayBuffer())).digest("hex");
        const firstHash = first ? sha256(first.saved_to) : null;
        check("the saved file is byte-identical to the API's download", direct.ok && firstHash === expected, { saved_to: first?.saved_to, sha256: firstHash, expected });

        const second = (await call("download_translation", { job_id: jobId, output_dir: outDir })).data;
        check(
            "a second download gets a new name and leaves the first file alone",
            second && second.saved_to !== first.saved_to && sha256(first.saved_to) === expected && sha256(second.saved_to) === expected,
            { first: first?.saved_to, second: second?.saved_to },
        );
    }

    const { data: listed } = await call("list_translations");
    check("the job shows up in the account's list", listed?.jobs.some((job) => job.job_id === jobId), listed?.jobs.map((job) => job.job_id));
} catch (error) {
    check("the run finished without an unexpected error", false, String(error?.stack ?? error));
}
await session?.close().catch(() => {});

report.finished_at = new Date().toISOString();
report.passed = report.checks.every((item) => item.passed);
save();
console.log(`${report.passed ? "PASSED" : "FAILED"}: ${path.join(artifacts, "transcript.json")}`);
process.exit(report.passed ? 0 : 1);
