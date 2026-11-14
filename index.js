#!/usr/bin/env node
// PageTranslate MCP server: translate PDF, DOCX, EPUB and image files with the layout kept.
import { openAsBlob, readFileSync } from "node:fs";
import { mkdir, open, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/server";
import { loadSkills } from "@modelcontextprotocol/server/ext/skills/node";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(path.join(here, "package.json"), "utf8"));
const APP = "https://pagetranslate.ai";
const API = `${(process.env.PAGETRANSLATE_API_URL || "https://api.pagetranslate.ai").replace(/\/+$/, "")}/api/v1`;

async function api(pathname, init = {}) {
    const key = process.env.PAGETRANSLATE_API_KEY;
    if (!key) {
        throw new Error(`PAGETRANSLATE_API_KEY is not set. Create a key at ${APP}/dashboard/api-keys and add it to this server's environment.`);
    }
    const res = await fetch(API + pathname, {
        ...init,
        headers: { Authorization: `Bearer ${key}`, "User-Agent": `pagetranslate-mcp/${version}`, ...init.headers },
    });
    if (res.ok) return res;
    const body = await res.text();
    let detail = body.slice(0, 500);
    try {
        const parsed = JSON.parse(body).detail;
        detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    } catch {
        // Not JSON (a proxy error page): keep the raw text.
    }
    if (res.status === 401) detail = `API key rejected. Check PAGETRANSLATE_API_KEY, or create a new key at ${APP}/dashboard/api-keys.`;
    throw Object.assign(new Error(`PageTranslate API error ${res.status}: ${detail}`), { status: res.status });
}

const getJob = async (jobId) => (await api(`/jobs/${encodeURIComponent(jobId)}`)).json();

function nextStep(job, price, paymentUrl) {
    if (job.status === "completed") return "Translation is ready. Call download_translation.";
    if (["failed", "cancelled", "aborted"].includes(job.status)) return `Translation ${job.status}. ${job.error ?? ""}`.trim();
    if (job.status !== "pending" || job.payment_status === "paid") {
        return `Translation in progress (${job.progress}%). Call get_translation again in about 30 seconds.`;
    }
    if (job.cost_cents == null) return "The price is still being calculated. Call get_translation again in a few seconds.";
    if (job.cost_cents === 0) return "Covered by the account's word balance. Tell the user, then call start_translation.";
    return `Costs ${price}. Ask the user to pay at ${paymentUrl} (signed in to PageTranslate). Translation starts by itself once paid; then call get_translation to follow it.`;
}

function summarize(job) {
    const price = job.cost_cents == null ? null : `${(job.cost_cents / 100).toFixed(2)} ${(job.currency || "usd").toUpperCase()}`;
    const unpaid = job.status === "pending" && job.payment_status !== "paid";
    const paymentUrl = `${APP}/dashboard?resume=${job.job_id}#upload`;
    return {
        job_id: job.job_id,
        filename: job.filename,
        status: job.status,
        progress: job.progress,
        source_language: job.source_lang,
        target_language: job.requested_language,
        word_count: job.word_count,
        price,
        payment_status: job.payment_status,
        ...(unpaid && job.cost_cents > 0 ? { payment_url: paymentUrl } : {}),
        next_step: nextStep(job, price, paymentUrl),
    };
}

const result = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const jobId = z.string().regex(/^[0-9a-f]{24}$/i, "job_id is the 24-character id returned by upload_document");

function createServer() {
    const server = new McpServer(
        { name: "pagetranslate", title: "PageTranslate", version, websiteUrl: APP },
        {
            instructions:
                "Translates whole documents (PDF, scanned PDF, DOCX, EPUB, images) into 70+ languages and returns a file with the original layout. " +
                "Flow: upload_document (free, returns the exact price) -> the user pays at payment_url, or start_translation when the account balance covers it -> " +
                "get_translation until status is completed -> download_translation. Never claim a translation is running before payment_status is paid.",
        },
    );

    server.registerTool(
        "upload_document",
        {
            title: "Upload a document and get a translation quote",
            description:
                "Upload a local PDF (text or scanned), DOCX, EPUB or image (PNG, JPG, WEBP, TIFF, BMP, GIF) to PageTranslate and get the exact price to translate it. " +
                "Uploading is free and does not start or charge anything. Returns job_id, word count, price and what to do next. Max 100 MB and 1,000 PDF pages; uploads are rate limited per account.",
            inputSchema: z.object({
                file_path: z.string().describe("Absolute path of the file on this computer."),
                target_language: z
                    .string()
                    .describe(
                        "Language code to translate into, e.g. es, fr, de, it, ja, ko, ar, hi, ru. Special codes: pt (Portugal) or pt-BR (Brazil), zh (Simplified) or zh-TW (Traditional), fil (Filipino), no (Norwegian).",
                    ),
            }),
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        },
        async ({ file_path, target_language }) => {
            const source = path.resolve(file_path);
            if (!(await stat(source).catch(() => null))?.isFile()) {
                throw new Error(`No file at ${source}. Pass the absolute path of a PDF, DOCX, EPUB or image file.`);
            }
            const form = new FormData();
            form.append("file", await openAsBlob(source), path.basename(source));
            form.append("requested_language", target_language.trim());
            const uploaded = await (await api("/upload/", { method: "POST", body: form })).json();
            return result(summarize(await getJob(uploaded.job_id)));
        },
    );

    server.registerTool(
        "start_translation",
        {
            title: "Start translating an uploaded document",
            description:
                "Start the translation of an uploaded job using the account's word balance (Pro plan words or credits). " +
                "If the balance does not cover it, nothing is charged and the response carries a payment_url for the user to pay by card; translation then starts by itself.",
            inputSchema: z.object({ job_id: jobId }),
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        },
        async ({ job_id }) => {
            let job = await getJob(job_id);
            let note;
            if (job.status === "pending") {
                try {
                    await api(`/jobs/${job_id}/translate`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: "{}",
                    });
                } catch (error) {
                    // 400: balance does not cover it. 409: already paid or queued. Either way the job says what is next.
                    if (error.status !== 400 && error.status !== 409) throw error;
                    note = error.message;
                }
                job = await getJob(job_id);
            }
            return result({ ...summarize(job), ...(note ? { note } : {}) });
        },
    );

    server.registerTool(
        "get_translation",
        {
            title: "Get translation status",
            description: "Get the status, progress, price and payment state of one translation job, and what to do next.",
            inputSchema: z.object({ job_id: jobId }),
            annotations: { readOnlyHint: true, openWorldHint: true },
        },
        async ({ job_id }) => result(summarize(await getJob(job_id))),
    );

    server.registerTool(
        "list_translations",
        {
            title: "List recent translations",
            description: "List the account's recent translation jobs, newest first, with status and price.",
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, openWorldHint: true },
        },
        async () => {
            const { jobs } = await (await api("/jobs/")).json();
            return result({ jobs: jobs.map(summarize) });
        },
    );

    server.registerTool(
        "download_translation",
        {
            title: "Download a finished translation",
            description:
                "Save the translated file of a completed job to this computer. It has the same format as the source (PDF, DOCX, EPUB or image). Never overwrites an existing file.",
            inputSchema: z.object({
                job_id: jobId,
                output_dir: z
                    .string()
                    .optional()
                    .describe("Folder to save into, usually the source file's folder. Defaults to the server's working directory."),
            }),
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        },
        async ({ job_id, output_dir }) => {
            const res = await api(`/jobs/${job_id}/download`);
            const header = res.headers.get("content-disposition") ?? "";
            const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
            const name = path.basename(encoded ? decodeURIComponent(encoded) : `translation-${job_id}`);
            const dir = path.resolve(output_dir || ".");
            await mkdir(dir, { recursive: true });
            const { name: stem, ext } = path.parse(name);
            let file;
            let target;
            for (let copy = 0; !file; copy += 1) {
                target = path.join(dir, copy ? `${stem} (${copy})${ext}` : name);
                // "wx" refuses to replace a file: the source may sit in this folder under the same name.
                file = await open(target, "wx").catch((error) => {
                    if (error.code !== "EEXIST") throw error;
                });
            }
            await pipeline(Readable.fromWeb(res.body), file.createWriteStream()).catch(async (error) => {
                await rm(target, { force: true }); // never leave a truncated file that looks like a translation
                throw error;
            });
            return result({ job_id, saved_to: target });
        },
    );

    return server;
}

// Also serve the bundled Agent Skill to clients that read skills over MCP. Optional: tools work without it.
const skills = await loadSkills(path.join(here, "skills")).catch(() => null);

serveStdio(() => {
    const server = createServer();
    skills?.attach(server);
    return server;
});
