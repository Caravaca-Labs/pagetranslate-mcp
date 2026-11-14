import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Download only: signed links were obtained through each real platform UI.
// Reject unexpected origins, redirects, error bodies and non-PDF responses.
const report = { date: new Date().toISOString(), downloads: [] };
await mkdir(new URL('./artifacts/', import.meta.url), { recursive: true });
for (const platform of ['replit', 'retool', 'bubble']) {
  const { url } = JSON.parse(await readFile(new URL(`../../private/integrations/${platform}-download.json`, import.meta.url)));
  assert.equal(new URL(url).origin, 'https://api.pagetranslate.ai');
  let response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(60000) });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const target = new URL(response.headers.get('location'));
    assert.equal(target.protocol, 'https:');
    assert.match(target.hostname, /(?:^|\.)s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/);
    response = await fetch(target, { redirect: 'error', signal: AbortSignal.timeout(60000) });
  }
  assert.equal(response.status, 200);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  await writeFile(new URL(`./artifacts/${platform}-translated-es.pdf`, import.meta.url), bytes);
  report.downloads.push({ platform, status: response.status, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), validPDF: true });
}
await writeFile(new URL('./download-proofs-20261114.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
