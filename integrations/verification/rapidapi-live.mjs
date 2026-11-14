import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Live failure cases: rejected auth, broken multipart, accidental start during
// quote, unexpected cash quote/word count, stalled job, unsafe download URL,
// and a response that is not actually a PDF. No secrets enter the report.
const base = 'https://pagetranslateai-document-translation.p.rapidapi.com';
const account = JSON.parse(await readFile(new URL('../../private/integrations/e2e-account.json', import.meta.url)));
const gateway = JSON.parse(await readFile(new URL('../../private/integrations/rapidapi-test-key.json', import.meta.url)));
const headers = {
  Authorization: `Bearer ${account.api_key}`,
  'X-RapidAPI-Key': gateway.key,
  'X-RapidAPI-Host': new URL(base).hostname,
};
const output = new URL('./rapidapi-live-20261114.json', import.meta.url);
const report = { date: new Date().toISOString(), gateway: base, operations: [], wordsSpent: 0, passed: false };
if (process.env.RESUME_COMPLETED === 'yes') {
  Object.assign(report, JSON.parse(await readFile(output)));
  report.resumedAt = new Date().toISOString();
  delete report.error;
}
async function call(path, method = 'GET', body) {
  const response = await fetch(base + path, {
    method, headers: { ...headers, ...(typeof body === 'string' ? { 'Content-Type': 'application/json' } : {}) },
    body, signal: AbortSignal.timeout(120000), redirect: 'error',
  });
  const json = await response.json();
  report.operations.push({ method, path, status: response.status });
  assert.ok(response.ok, `Gateway ${method} ${path}: HTTP ${response.status}`);
  return json;
}
try {
  let quote;
  if (process.env.EXISTING_JOB_ID) {
    quote = { job_id: process.env.EXISTING_JOB_ID };
  } else {
    const form = new FormData();
    const bytes = await readFile(process.env.FIXTURE_PDF ?? new URL('../../test/fixtures/sample.pdf', import.meta.url));
    form.append('file', new Blob([bytes], { type: 'application/pdf' }), 'sample.pdf');
    form.append('requested_language', 'es');
    quote = await call('/upload/', 'POST', form);
  }
  assert.match(quote.job_id, /^[a-f0-9]{24}$/);
  report.jobId = quote.job_id;
  let job = await call(`/jobs/${quote.job_id}`);
  if (process.env.RESUME_COMPLETED !== 'yes') {
    report.quoteStatus = job.status;
    assert.equal(job.status, 'pending');
    assert.equal(job.word_count, 100);
    assert.equal(job.cost_cents, 0);
    await call('/jobs/?limit=2');
    assert.equal(process.env.CONFIRM_SPEND_100_WORDS, 'yes', 'Explicit 100-word run confirmation required');
    await call(`/jobs/${quote.job_id}/translate`, 'POST', JSON.stringify({ payment_method: 'credits' }));
    report.wordsSpent = 100;
  } else {
    assert.equal(job.status, 'completed');
  }
  for (let attempt = 0; attempt < 12; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 30000));
    job = await call(`/jobs/${quote.job_id}`);
    if (job.status === 'completed') break;
    assert.ok(!['failed', 'cancelled'].includes(job.status), `Terminal status: ${job.status}`);
  }
  assert.equal(job.status, 'completed');
  const link = await call(`/jobs/${quote.job_id}/download-link`, 'POST');
  assert.equal(link.expires_in, 3600);
  const url = new URL(link.download_path, 'https://api.pagetranslate.ai');
  assert.equal(url.origin, 'https://api.pagetranslate.ai');
  let response = await fetch(url, { signal: AbortSignal.timeout(120000), redirect: 'manual' });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const target = new URL(response.headers.get('location'));
    assert.equal(target.protocol, 'https:');
    assert.match(target.hostname, /(?:^|\.)s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/);
    response = await fetch(target, { signal: AbortSignal.timeout(120000), redirect: 'error' });
  }
  assert.ok(response.ok);
  const result = Buffer.from(await response.arrayBuffer());
  assert.equal(result.subarray(0, 5).toString(), '%PDF-');
  await mkdir(new URL('./artifacts/', import.meta.url), { recursive: true });
  await writeFile(new URL('./artifacts/rapidapi-translated-es.pdf', import.meta.url), result);
  report.download = { bytes: result.length, sha256: createHash('sha256').update(result).digest('hex'), expiresIn: link.expires_in };
  report.passed = true;
} catch (error) {
  report.error = error instanceof Error ? error.message : 'Unknown test failure';
  process.exitCode = 1;
} finally {
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
