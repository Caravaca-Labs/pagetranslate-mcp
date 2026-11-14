import { readFile, unlink } from "node:fs/promises";
import { extname } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { Router, type IRouter, type RequestHandler } from "express";
import multer from "multer";

const router: IRouter = Router();
const PAGE_TRANSLATE_API = "https://api.pagetranslate.ai/api/v1";
const MAX_FILE_SIZE = 100_000_000;
const JOB_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const LANGUAGE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".epub",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".tif",
  ".tiff",
  ".bmp",
  ".gif",
]);

class UnsupportedFileError extends Error {}

type UpstreamReply = {
  response: globalThis.Response;
  text: string;
  json: unknown;
};

const diskUpload = multer({
  storage: multer.diskStorage({
    destination: tmpdir(),
    filename: (_req, _file, callback) => callback(null, randomUUID()),
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 1,
    parts: 2,
    fieldSize: 128,
  },
  fileFilter: (_req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      callback(new UnsupportedFileError("Unsupported file format."));
      return;
    }
    callback(null, true);
  },
});

const requireVisitorKey: RequestHandler = (req, res, next) => {
  const authorization = req.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match || match[1].length > 4096) {
    res.status(401).json({ error: "Enter a valid PageTranslateAI API key." });
    return;
  }

  // Kept only in this request's memory; never logged or persisted.
  res.locals.visitorToken = match[1] as string;
  res.locals.visitorAuthorization = `Bearer ${match[1] as string}`;
  next();
};

const parseUpload: RequestHandler = (req, res, next) => {
  diskUpload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      res.status(tooLarge ? 413 : 400).json({
        error: tooLarge
          ? "Files must be 100 MB or smaller."
          : "Upload must contain one file and a requested language.",
      });
      return;
    }
    if (error instanceof UnsupportedFileError) {
      res.status(415).json({
        error: "Use a PDF, DOCX, EPUB, PNG, JPG, WEBP, TIFF, BMP, or GIF file.",
      });
      return;
    }
    if (error) {
      res.status(400).json({ error: "The upload could not be read." });
      return;
    }
    next();
  });
};

function validJobId(value: unknown): value is string {
  return typeof value === "string" && JOB_ID_PATTERN.test(value);
}

function jobIdFromRequest(req: Parameters<RequestHandler>[0]): string | null {
  const value = Array.isArray(req.params.job_id)
    ? req.params.job_id[0]
    : req.params.job_id;
  return validJobId(value) ? value : null;
}

async function callPageTranslate(
  path: string,
  method: "GET" | "POST",
  authorization: string,
  body?: string | FormData,
): Promise<globalThis.Response> {
  const isMultipart = body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: authorization,
    Accept: "application/json",
  };

  if (!isMultipart && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const request: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    body: body as never,
    redirect: "error",
    signal: AbortSignal.timeout(isMultipart ? 10 * 60 * 1000 : 60 * 1000),
  };
  if (isMultipart) request.duplex = "half";

  return fetch(`${PAGE_TRANSLATE_API}${path}`, request);
}

async function readUpstream(
  response: globalThis.Response,
  visitorToken: string,
): Promise<UpstreamReply> {
  const raw = await response.text();
  const text = visitorToken ? raw.split(visitorToken).join("[redacted]") : raw;
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Preserve non-JSON provider errors as text for the visitor.
  }
  return { response, text, json };
}

function sendUpstreamReply(
  res: Parameters<RequestHandler>[1],
  reply: UpstreamReply,
): void {
  res.status(reply.response.status);
  res.setHeader("Cache-Control", "no-store");
  const contentType = reply.response.headers.get("content-type");
  if (contentType) res.setHeader("Content-Type", contentType);
  res.send(reply.text);
}

function sendProviderUnavailable(
  res: Parameters<RequestHandler>[1],
  error: unknown,
): void {
  const isTimeout =
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError");
  res.status(isTimeout ? 504 : 502).json({
    error: isTimeout
      ? "PageTranslateAI took too long to respond. Try again."
      : "Could not reach PageTranslateAI. Check your connection and try again.",
  });
}

async function getJob(
  jobId: string,
  authorization: string,
  visitorToken: string,
): Promise<UpstreamReply> {
  const response = await callPageTranslate(
    `/jobs/${jobId}`,
    "GET",
    authorization,
  );
  return readUpstream(response, visitorToken);
}

router.post(
  "/pagetranslate/upload",
  requireVisitorKey,
  parseUpload,
  async (req, res): Promise<void> => {
    const file = req.file;
    const requestedLanguage = req.body?.requested_language;
    if (!file) {
      res.status(400).json({ error: "Choose a supported document to upload." });
      return;
    }
    if (
      typeof requestedLanguage !== "string" ||
      !LANGUAGE_PATTERN.test(requestedLanguage)
    ) {
      await unlink(file.path).catch(() => undefined);
      res.status(400).json({ error: "Choose a valid target language." });
      return;
    }

    if (extname(file.originalname).toLowerCase() === ".pdf") {
      try {
        const document = await PDFDocument.load(await readFile(file.path), {
          updateMetadata: false,
          throwOnInvalidObject: true,
        });
        const pages = document.getPageCount();
        if (!Number.isInteger(pages) || pages < 1) {
          await unlink(file.path).catch(() => undefined);
          res.status(422).json({
            error: "Could not verify the PDF page count. Check that the PDF is readable.",
          });
          return;
        }
        if (pages > 1000) {
          await unlink(file.path).catch(() => undefined);
          res.status(413).json({
            error: "PDFs must contain 1,000 pages or fewer.",
          });
          return;
        }
      } catch {
        await unlink(file.path).catch(() => undefined);
        res.status(422).json({
          error:
            "Could not verify the PDF page count. Check that the PDF is readable and has 1,000 pages or fewer.",
        });
        return;
      }
    }

    try {
      const form = new FormData();
      const safeFilename = file.originalname.replaceAll(/[\\/]/g, "_");
      const bytes = await readFile(file.path);
      form.append("file", new Blob([new Uint8Array(bytes)], {
        type: file.mimetype || "application/octet-stream",
      }), safeFilename);
      form.append("requested_language", requestedLanguage);
      const response = await callPageTranslate(
        "/upload/",
        "POST",
        res.locals.visitorAuthorization as string,
        form,
      );
      const reply = await readUpstream(
        response,
        res.locals.visitorToken as string,
      );
      sendUpstreamReply(res, reply);
    } catch (error) {
      sendProviderUnavailable(res, error);
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  },
);

router.get(
  "/pagetranslate/jobs",
  requireVisitorKey,
  async (_req, res): Promise<void> => {
    try {
      const response = await callPageTranslate(
        "/jobs/",
        "GET",
        res.locals.visitorAuthorization as string,
      );
      const reply = await readUpstream(
        response,
        res.locals.visitorToken as string,
      );
      sendUpstreamReply(res, reply);
    } catch (error) {
      sendProviderUnavailable(res, error);
    }
  },
);

router.get(
  "/pagetranslate/jobs/:job_id",
  requireVisitorKey,
  async (req, res): Promise<void> => {
    const jobId = jobIdFromRequest(req);
    if (!jobId) {
      res.status(400).json({ error: "Invalid job ID." });
      return;
    }

    try {
      const reply = await getJob(
        jobId,
        res.locals.visitorAuthorization as string,
        res.locals.visitorToken as string,
      );
      sendUpstreamReply(res, reply);
    } catch (error) {
      sendProviderUnavailable(res, error);
    }
  },
);

router.post(
  "/pagetranslate/jobs/:job_id/translate",
  requireVisitorKey,
  async (req, res): Promise<void> => {
    const jobId = jobIdFromRequest(req);
    if (!jobId) {
      res.status(400).json({ error: "Invalid job ID." });
      return;
    }
    if (
      !req.body ||
      req.body.payment_method !== "credits" ||
      Object.keys(req.body).length !== 1
    ) {
      res.status(400).json({
        error: "Only the credits payment method is supported.",
      });
      return;
    }

    const authorization = res.locals.visitorAuthorization as string;
    const visitorToken = res.locals.visitorToken as string;
    try {
      const quote = await getJob(jobId, authorization, visitorToken);
      if (!quote.response.ok) {
        sendUpstreamReply(res, quote);
        return;
      }
      const quoteData = quote.json as { cost_cents?: unknown } | null;
      if (!quoteData || quoteData.cost_cents !== 0) {
        res.status(409).json({
          error:
            "Translation was not started. The quote must have cost_cents equal to 0.",
        });
        return;
      }

      const response = await callPageTranslate(
        `/jobs/${jobId}/translate`,
        "POST",
        authorization,
        JSON.stringify({ payment_method: "credits" }),
      );
      const reply = await readUpstream(response, visitorToken);
      sendUpstreamReply(res, reply);
    } catch (error) {
      sendProviderUnavailable(res, error);
    }
  },
);

router.post(
  "/pagetranslate/jobs/:job_id/download-link",
  requireVisitorKey,
  async (req, res): Promise<void> => {
    const jobId = jobIdFromRequest(req);
    if (!jobId) {
      res.status(400).json({ error: "Invalid job ID." });
      return;
    }

    const authorization = res.locals.visitorAuthorization as string;
    const visitorToken = res.locals.visitorToken as string;
    try {
      const job = await getJob(jobId, authorization, visitorToken);
      if (!job.response.ok) {
        sendUpstreamReply(res, job);
        return;
      }
      const jobData = job.json as { status?: unknown } | null;
      if (
        !jobData ||
        typeof jobData.status !== "string" ||
        jobData.status.toLowerCase() !== "completed"
      ) {
        res.status(409).json({
          error: "A download link is available only after the job is completed.",
        });
        return;
      }

      const response = await callPageTranslate(
        `/jobs/${jobId}/download-link`,
        "POST",
        authorization,
      );
      const reply = await readUpstream(response, visitorToken);
      if (reply.response.ok) {
        const data = reply.json as { download_path?: unknown } | null;
        const downloadPath = data?.download_path;
        let safePath = false;
        if (
          typeof downloadPath === "string" &&
          downloadPath.startsWith("/") &&
          !downloadPath.startsWith("//")
        ) {
          try {
            safePath =
              new URL(downloadPath, "https://api.pagetranslate.ai").origin ===
              "https://api.pagetranslate.ai";
          } catch {
            safePath = false;
          }
        }
        if (!safePath) {
          res.status(502).json({
            error: "PageTranslateAI returned an invalid download path.",
          });
          return;
        }
      }
      sendUpstreamReply(res, reply);
    } catch (error) {
      sendProviderUnavailable(res, error);
    }
  },
);

export default router;
