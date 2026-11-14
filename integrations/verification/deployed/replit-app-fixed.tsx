import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  getGetTranslationJobQueryKey,
  getListTranslationJobsQueryKey,
  useCreateTranslationDownloadLink,
  useGetTranslationJob,
  useListTranslationJobs,
  useStartTranslationJob,
  useUploadTranslationDocument,
} from '@workspace/api-client-react';
import type { TranslationDownloadLink } from '@workspace/api-client-react';

const queryClient = new QueryClient();
const DOWNLOAD_ORIGIN = 'https://api.pagetranslate.ai';
const MAX_FILE_BYTES = 100_000_000;
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'epub', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp', 'gif'];
const LANGUAGES = [
  ['ar', 'Arabic'], ['zh', 'Chinese (Simplified)'], ['zh-TW', 'Chinese (Traditional)'],
  ['nl', 'Dutch'], ['en', 'English'], ['fr', 'French'], ['de', 'German'], ['el', 'Greek'],
  ['he', 'Hebrew'], ['hi', 'Hindi'], ['id', 'Indonesian'], ['it', 'Italian'], ['ja', 'Japanese'],
  ['ko', 'Korean'], ['pl', 'Polish'], ['pt-BR', 'Portuguese (Brazil)'], ['pt-PT', 'Portuguese (Portugal)'], ['ru', 'Russian'], ['es', 'Spanish'],
  ['sv', 'Swedish'], ['th', 'Thai'], ['tr', 'Turkish'], ['uk', 'Ukrainian'], ['vi', 'Vietnamese'],
];
const ONLINE_VERSION_LINKS = [
  { label: 'PageTranslate PDF translator', href: 'https://pagetranslate.ai/pdf-translator' },
  { label: 'PageTranslate EPUB translator', href: 'https://pagetranslate.ai/epub-translator' },
  { label: 'PageTranslate DOCX translator', href: 'https://pagetranslate.ai/docx-translator' },
  { label: 'Translate a book', href: 'https://pagetranslate.ai/translate-a-book' },
  { label: 'Document translation software', href: 'https://pagetranslate.ai/document-translation-software' },
  { label: 'AI novel translator', href: 'https://pagetranslate.ai/translate-a-book/ai-novel-translator' },
  { label: 'Translate a large PDF', href: 'https://pagetranslate.ai/pdf-translator/translate-large-pdf' },
];
const GUIDE_AND_TOOL_LINKS = [
  { label: 'How much does it cost to translate a book', href: 'https://pagetranslate.ai/faq/how-much-does-it-cost-to-translate-a-book' },
  { label: 'Translation cost calculator', href: 'https://pagetranslate.ai/tools/translation-cost-calculator' },
  { label: 'How to translate a scanned PDF', href: 'https://pagetranslate.ai/faq/how-to-translate-scanned-pdf' },
  { label: 'How to open EPUB on Kindle', href: 'https://pagetranslate.ai/blog/how-to-open-epub-on-kindle' },
  { label: 'Translation software for legal documents', href: 'https://pagetranslate.ai/document-translation-software/translation-software-for-legal-documents' },
  { label: 'Translate English to Spanish documents', href: 'https://pagetranslate.ai/document-translation-software/google-translate-english-to-spanish-documents' },
  { label: 'EPUB merger', href: 'https://pagetranslate.ai/tools/epub-merger' },
  { label: 'Free tools for authors', href: 'https://pagetranslate.ai/tools' },
];

function formatCost(cents?: number) {
  if (typeof cents !== 'number') return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function fileIsAllowed(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXTENSIONS.includes(extension);
}

function isTerminal(status?: string) {
  return ['completed', 'failed', 'cancelled'].includes((status ?? '').toLowerCase());
}

function AppContent() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('es');
  const [isDragging, setIsDragging] = useState(false);
  const [quoteJobId, setQuoteJobId] = useState('');
  const [activeJobId, setActiveJobId] = useState('');
  const [creditConfirmed, setCreditConfirmed] = useState(false);
  const [formError, setFormError] = useState('');
  const [downloadLinks, setDownloadLinks] = useState<Record<string, TranslationDownloadLink>>({});
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string>>({});
  const [pollCount, setPollCount] = useState(0);
  const autoLinkRequested = useRef('');
  const authorization = useMemo(() => ({ headers: { Authorization: `Bearer ${apiKey}` } }), [apiKey]);

  const uploadMutation = useUploadTranslationDocument({ request: authorization });
  const startMutation = useStartTranslationJob({ request: authorization });
  const linkMutation = useCreateTranslationDownloadLink({ request: authorization });
  const jobsQuery = useListTranslationJobs({
    query: { enabled: apiKey.trim().length > 0, queryKey: getListTranslationJobsQueryKey(), refetchOnWindowFocus: false },
    request: authorization,
  });
  const jobQuery = useGetTranslationJob(quoteJobId, {
    query: {
      enabled: Boolean(apiKey.trim() && quoteJobId),
      queryKey: getGetTranslationJobQueryKey(quoteJobId),
      refetchOnWindowFocus: false,
    },
    request: authorization,
  });
  const quote = jobQuery.data;
  const currentJob = quote?.job_id === activeJobId ? quote : undefined;
  const recentJobs = jobsQuery.data?.jobs ?? [];

  useEffect(() => {
    if (
      !activeJobId ||
      currentJob?.job_id !== activeJobId ||
      isTerminal(currentJob.status) ||
      pollCount >= 20
    ) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      await jobQuery.refetch();
      if (active) setPollCount((count) => count + 1);
    }, 30_000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activeJobId, currentJob?.job_id, currentJob?.status, pollCount, jobQuery.refetch]);

  useEffect(() => {
    if (currentJob?.status?.toLowerCase() === 'completed' && autoLinkRequested.current !== currentJob.job_id) {
      autoLinkRequested.current = currentJob.job_id;
      requestDownloadLink(currentJob.job_id);
    }
  // requestDownloadLink reads the current hook function; the completed job id guards duplicate requests.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJob?.job_id, currentJob?.status]);

  function setSelectedFile(candidate: File | null) {
    setFormError('');
    if (!candidate) return;
    if (!fileIsAllowed(candidate)) {
      setFile(null);
      setFormError('That file type is not supported. Choose PDF, DOCX, EPUB, PNG, JPG, WEBP, TIFF, BMP, or GIF.');
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFile(null);
      setFormError('Files must be 100 MB or smaller.');
      return;
    }
    setFile(candidate);
  }

  function updateApiKey(value: string) {
    if (value !== apiKey) {
      queryClient.removeQueries({ queryKey: getListTranslationJobsQueryKey(), exact: true });
      if (quoteJobId) queryClient.removeQueries({ queryKey: getGetTranslationJobQueryKey(quoteJobId), exact: true });
      setQuoteJobId('');
      setActiveJobId('');
      setCreditConfirmed(false);
      setDownloadLinks({});
      setDownloadErrors({});
      autoLinkRequested.current = '';
      setPollCount(0);
    }
    setApiKey(value);
  }

  function onFileDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    setSelectedFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function submitForQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!apiKey.trim()) {
      setFormError('Enter your PageTranslateAI API key to continue.');
      return;
    }
    if (!file) {
      setFormError('Choose a document before requesting a quote.');
      return;
    }
    setCreditConfirmed(false);
    setActiveJobId('');
    setPollCount(0);
    try {
      const result = await uploadMutation.mutateAsync({ data: { file, requested_language: language } });
      setQuoteJobId(result.job_id);
      autoLinkRequested.current = '';
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetTranslationJobQueryKey(result.job_id) }),
        queryClient.invalidateQueries({ queryKey: getListTranslationJobsQueryKey() }),
      ]);
    } catch (error) {
      setFormError(messageFromError(error));
    }
  }

  async function startTranslation() {
    if (!quoteJobId || !quote || quote.cost_cents !== 0 || !creditConfirmed || !apiKey.trim()) return;
    setFormError('');
    try {
      const started = await startMutation.mutateAsync({ jobId: quoteJobId, data: { payment_method: 'credits' } });
      setActiveJobId(started.job_id);
      setPollCount(0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetTranslationJobQueryKey(started.job_id) }),
        queryClient.invalidateQueries({ queryKey: getListTranslationJobsQueryKey() }),
      ]);
    } catch (error) {
      setFormError(messageFromError(error));
    }
  }

  function requestDownloadLink(jobId: string) {
    setDownloadErrors((previous) => ({ ...previous, [jobId]: '' }));
    linkMutation.mutate({ jobId }, {
      onSuccess: (freshLink) => setDownloadLinks((previous) => ({ ...previous, [jobId]: freshLink })),
      onError: (error) => setDownloadErrors((previous) => ({ ...previous, [jobId]: messageFromError(error) })),
    });
  }

  async function refreshAll() {
    if (!apiKey.trim()) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListTranslationJobsQueryKey() }),
      ...(quoteJobId ? [queryClient.invalidateQueries({ queryKey: getGetTranslationJobQueryKey(quoteJobId) })] : []),
    ]);
  }

  function downloadUrl(link: TranslationDownloadLink) {
    return `${DOWNLOAD_ORIGIN}${link.download_path.startsWith('/') ? '' : '/'}${link.download_path}`;
  }

  const quoteLoading = Boolean(quoteJobId && jobQuery.isLoading);
  const nonZeroQuote = typeof quote?.cost_cents === 'number' && quote.cost_cents !== 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="page-wrap flex items-center justify-between">
          <a className="brand flex items-center gap-2.5 no-underline text-inherit" href="https://pagetranslate.ai" target="_blank" rel="noreferrer">
            <img src="/pagetranslate-logo.png" alt="PageTranslateAI logo" data-testid="img-brand-logo" />
            <span className="brand-name">PageTranslate<span>AI</span></span>
          </a>
          <nav className="top-links flex items-center gap-7" aria-label="PageTranslateAI links">
            <a className="top-link" href="https://pagetranslate.ai" target="_blank" rel="noreferrer">About</a>
            <a className="top-link" href="https://pagetranslate.ai/api" target="_blank" rel="noreferrer">API guide</a>
            <a className="top-link" href="https://pagetranslate.ai/privacy" target="_blank" rel="noreferrer">Privacy</a>
          </nav>
        </div>
      </header>

      <main className="page-wrap main-grid">
        <section>
          <div className="eyebrow">Document translation / visitor workspace</div>
          <h1 className="page-title">A clear quote before a single credit is spent.</h1>
          <p className="intro">Translate a document with your own PageTranslateAI key. Review the word count and cost first, then decide whether to use your existing credits.</p>

          <form className="card-panel translator-card" onSubmit={submitForQuote}>
            <div className="section-head">
              <div className="flex gap-3">
                <span className="step-number">01</span>
                <div>
                  <h2 className="section-title">Prepare a translation</h2>
                  <p className="section-note">Your document is uploaded only to create a quote.</p>
                </div>
              </div>
              <span className="eyebrow hidden sm:block">Quote first</span>
            </div>

            <div className="mt-5">
              <label
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onFileDrop}
                data-testid="dropzone-document"
              >
                <input
                  className="file-input"
                  type="file"
                  accept=".pdf,.docx,.epub,.png,.jpg,.jpeg,.webp,.tiff,.bmp,.gif"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  aria-label="Choose document"
                  data-testid="input-document"
                />
                <span className="drop-icon"><ArrowUpFromLine size={18} /></span>
                <span className="min-w-0">
                  <span className="drop-main block">{file ? 'Document ready to quote' : 'Drop a document here, or browse files'}</span>
                  <span className="drop-sub block">PDF, DOCX, EPUB, PNG, JPG, WEBP, TIFF, BMP, GIF · 100 MB max · PDFs up to 1,000 pages</span>
                  {file && <span className="drop-file block" data-testid="text-selected-filename">{file.name}</span>}
                </span>
              </label>
            </div>

            <div className="form-row">
              <div>
                <label className="field-label" htmlFor="language">Translate into</label>
                <div className="relative">
                  <select id="language" className="select-field appearance-none pr-9" value={language} onChange={(event) => setLanguage(event.target.value)} data-testid="select-language">
                    {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="field-hint">Choose the output language for this document.</p>
              </div>
              <div className="flex flex-col justify-end">
                <button className="primary-btn w-full" type="submit" disabled={uploadMutation.isPending || !file || !apiKey.trim()} data-testid="button-get-quote">
                  {uploadMutation.isPending ? <><RefreshCw size={14} className="animate-spin" /> Preparing quote…</> : <><Sparkles size={14} /> Upload for a quote</>}
                </button>
                <p className="field-hint">No translation starts from this action.</p>
              </div>
            </div>

            {formError && <div className="error-box" role="alert" data-testid="status-form-error"><AlertCircle size={15} />{formError}</div>}
            {uploadMutation.isError && !formError && <div className="error-box" role="alert"><AlertCircle size={15} />{messageFromError(uploadMutation.error)}</div>}
            {quoteLoading && (
              <div className="quote-box animate-pulse" aria-label="Loading quote" data-testid="loading-quote">
                <div className="h-4 w-32 rounded bg-[#dce7de]" /><div className="mt-4 h-7 w-24 rounded bg-[#dce7de]" />
              </div>
            )}
            {jobQuery.isError && quoteJobId && (
              <div className="error-box" role="alert" data-testid="status-job-error"><AlertCircle size={15} />{messageFromError(jobQuery.error)}</div>
            )}
            {quote && !quoteLoading && (
              <div className="quote-box" data-testid="panel-quote">
                <div className="quote-top">
                  <div>
                    <div className="quote-caption">Quote ready · {quote.status}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Job {quote.job_id}</div>
                  </div>
                  <div className="quote-price" data-testid="text-quote-cost">{formatCost(quote.cost_cents)}</div>
                </div>
                <div className="quote-stats">
                  <div><div className="stat-label">Words detected</div><div className="stat-value" data-testid="text-word-count">{typeof quote.word_count === 'number' ? quote.word_count.toLocaleString() : '—'}</div></div>
                  <div><div className="stat-label">Quoted cost</div><div className="stat-value">{typeof quote.cost_cents === 'number' ? `${quote.cost_cents}¢` : 'Not available'}</div></div>
                  <div><div className="stat-label">Target language</div><div className="stat-value">{LANGUAGES.find(([code]) => code === language)?.[1] ?? language}</div></div>
                </div>
                {nonZeroQuote ? (
                  <div className="error-box mt-4"><CircleHelp size={15} />This quote is not zero-cost. Translation cannot be started here; this tool supports existing credits only and never charges a card.</div>
                ) : quote.cost_cents === 0 ? (
                  <>
                    <label className="confirm-line">
                      <input type="checkbox" checked={creditConfirmed} onChange={(event) => setCreditConfirmed(event.target.checked)} data-testid="checkbox-confirm-credits" />
                      <span>I understand this translation will use my existing PageTranslateAI credits.</span>
                    </label>
                    <div className="quote-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={startTranslation}
                        disabled={!creditConfirmed || startMutation.isPending || !apiKey.trim()}
                        data-testid="button-start-translation"
                      >
                        {startMutation.isPending ? <><RefreshCw size={14} className="animate-spin" /> Starting…</> : <><Check size={14} /> Start with credits</>}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="field-hint mt-4">A zero-cost quote is required before the credits-only start option is available.</p>
                )}
              </div>
            )}
            {startMutation.isError && <div className="error-box" role="alert"><AlertCircle size={15} />{messageFromError(startMutation.error)}</div>}

            {currentJob && (
              <div className="quote-box mt-4" data-testid="panel-active-job">
                <div className="quote-top">
                  <div><div className="quote-caption">Translation status</div><div className="mt-1 font-semibold capitalize">{currentJob.status}</div></div>
                  <span className="progress-text">{typeof currentJob.progress === 'number' ? `${currentJob.progress}%` : ''}</span>
                </div>
                {typeof currentJob.progress === 'number' && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dce7de]"><div className="h-full rounded-full bg-[#386f5d] transition-all" style={{ width: `${Math.max(0, Math.min(100, currentJob.progress))}%` }} /></div>}
                {currentJob.error && <div className="error-box">{currentJob.error}</div>}
                {isTerminal(currentJob.status) && <div className="field-hint mt-3">Status updates stop when a job is completed, failed, or cancelled.</div>}
                {pollCount >= 20 && !isTerminal(currentJob.status) && <div className="field-hint mt-3">Automatic status checks paused after 20 requests. Use refresh to check again.</div>}
              </div>
            )}
          </form>
        </section>

        <aside className="card-panel side-panel">
          <div className="flex items-start gap-3">
            <span className="drop-icon"><KeyRound size={17} /></span>
            <div><h2 className="side-title">Use your API key</h2><p className="side-intro">Bring your own PageTranslateAI key. It stays in this page's memory.</p></div>
          </div>
          <label htmlFor="api-key" className="field-label">PageTranslateAI API key</label>
      <div className="key-entry">
            <input
              id="api-key"
              className="input-field"
              type="password"
              value={apiKey}
              onChange={(event) => updateApiKey(event.target.value)}
              placeholder="Paste your API key"
              autoComplete="off"
              spellCheck={false}
              data-testid="input-api-key"
            />
          </div>
          <div className="key-state" data-testid="status-key-entry"><span className={`key-dot ${apiKey.trim() ? 'ready' : ''}`} />{apiKey.trim() ? 'Key held in memory for this session' : 'Enter a key to enable requests'}</div>
          <div className="fine-print">
            <div className="flex gap-2"><LockKeyhole size={14} className="mt-0.5 shrink-0 text-[#386f5d]" /><span><strong>Your key is never saved.</strong> This page does not write it to storage, a cookie, or a URL. It is sent only in the authorization header to this site's same-origin API proxy.</span></div>
            <div className="mt-3 flex gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#386f5d]" /><span>Your document is sent for quote and translation processing. Review the <a className="underline underline-offset-2" href="https://pagetranslate.ai/privacy" target="_blank" rel="noreferrer">privacy policy</a> before uploading sensitive files.</span></div>
          </div>
          <div className="mt-4 rounded-lg bg-[#f4f2e9] p-3 text-[11px] leading-relaxed text-muted-foreground">
            Need a key? Visit the <a className="font-semibold text-[#315e50] underline underline-offset-2" href="https://pagetranslate.ai/api" target="_blank" rel="noreferrer">PageTranslateAI API guide</a>.
          </div>
        </aside>

        <section className="jobs-section">
          <div className="jobs-heading">
            <div><h2>Recent jobs</h2><p className="section-note mt-1">Jobs associated with your supplied key.</p></div>
            <button type="button" className="quiet-btn" onClick={refreshAll} disabled={!apiKey.trim() || jobsQuery.isFetching} data-testid="button-refresh-jobs">
              <RefreshCw size={13} className={jobsQuery.isFetching ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          <div className="card-panel jobs-card">
            <div className="jobs-header"><span>Job reference</span><span>Status</span><span>Progress</span><span>Result</span></div>
            {jobsQuery.isLoading && <div aria-label="Loading recent jobs" data-testid="loading-recent-jobs"><div className="loading-row" /><div className="loading-row" /><div className="loading-row" /></div>}
            {jobsQuery.isError && (
              <div className="empty-state" role="alert" data-testid="status-jobs-error">
                <div className="empty-mark"><AlertCircle size={18} /></div>
                Could not load recent jobs: {messageFromError(jobsQuery.error)} <button type="button" className="underline" onClick={refreshAll}>Try again</button>
              </div>
            )}
            {!jobsQuery.isLoading && !jobsQuery.isError && !apiKey.trim() && (
              <div className="empty-state"><div className="empty-mark"><KeyRound size={18} /></div>Enter your API key to view your recent translation jobs.</div>
            )}
            {!jobsQuery.isLoading && !jobsQuery.isError && apiKey.trim() && recentJobs.length === 0 && (
              <div className="empty-state" data-testid="empty-recent-jobs"><div className="empty-mark"><FileText size={18} /></div>No recent jobs yet. Your jobs will appear here after you request a quote.</div>
            )}
            {!jobsQuery.isLoading && !jobsQuery.isError && recentJobs.map((job) => {
              const link = downloadLinks[job.job_id];
              const isCurrent = currentJob?.job_id === job.job_id;
              const shownProgress = isCurrent && typeof currentJob.progress === 'number' ? currentJob.progress : job.progress;
              const shownStatus = isCurrent ? currentJob.status : job.status;
              return (
                <div className="job-row" key={job.job_id} data-testid={`row-job-${job.job_id}`}>
                  <div className="min-w-0">
                    <div className="job-name" title={job.job_id}>{job.job_id}</div>
                    <div className="job-id-sub">{typeof job.word_count === 'number' ? `${job.word_count.toLocaleString()} words` : 'Document translation'}</div>
                  </div>
                  <div><span className="status-pill" data-status={shownStatus.toLowerCase()} data-testid={`status-job-${job.job_id}`}>{shownStatus}</span></div>
                  <div>
                    <span className="progress-text">{typeof shownProgress === 'number' ? `${shownProgress}%` : '—'}</span>
                    {typeof shownProgress === 'number' && <div className="job-progress"><span style={{ width: `${Math.max(0, Math.min(100, shownProgress))}%` }} /></div>}
                  </div>
                  <div className="job-action">
                    {link ? (
                      <div className="flex flex-wrap gap-1">
                        <a className="quiet-btn no-underline" href={downloadUrl(link)} target="_blank" rel="noreferrer" download={link.filename} data-testid={`link-download-${job.job_id}`}><ArrowDownToLine size={13} /> Download</a>
                        <button type="button" className="quiet-btn" onClick={() => requestDownloadLink(job.job_id)} disabled={linkMutation.isPending} data-testid={`button-refresh-download-${job.job_id}`}>Fresh link</button>
                      </div>
                    ) : shownStatus.toLowerCase() === 'completed' ? (
                      <button type="button" className="quiet-btn" onClick={() => requestDownloadLink(job.job_id)} disabled={linkMutation.isPending} data-testid={`button-create-download-${job.job_id}`}>
                        {linkMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <ArrowDownToLine size={13} />} Get file
                      </button>
                    ) : <span className="text-[10px] text-muted-foreground">—</span>}
                  </div>
                  {(downloadErrors[job.job_id] || (link && link.filename)) && (
                    <div className="col-span-full -mt-1 pb-1 text-[10px] text-muted-foreground" data-testid={`text-download-detail-${job.job_id}`}>
                      {downloadErrors[job.job_id] ? <span className="text-[#913d32]">{downloadErrors[job.job_id]}</span> : <>File: {link.filename} · Expires in {link.expires_in >= 3600 ? `${Math.floor(link.expires_in / 3600)} hour${link.expires_in >= 7200 ? 's' : ''}` : `${Math.ceil(link.expires_in / 60)} minutes`}</>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {currentJob && downloadLinks[currentJob.job_id] && (
            <div className="mt-3 rounded-xl border border-[#d8e5dc] bg-[#f3f7f1] px-4 py-3 text-xs" data-testid="status-download-ready">
              <div className="flex items-center gap-2 font-semibold text-[#315e50]"><Check size={14} />Your translated file is ready</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                <span>{downloadLinks[currentJob.job_id].filename}</span>
                <span>·</span>
                <span>Link expires in {downloadLinks[currentJob.job_id].expires_in >= 3600 ? '1 hour' : `${Math.ceil(downloadLinks[currentJob.job_id].expires_in / 60)} minutes`}</span>
                <a className="font-semibold text-[#315e50] underline underline-offset-2" href={downloadUrl(downloadLinks[currentJob.job_id])} target="_blank" rel="noreferrer" download={downloadLinks[currentJob.job_id].filename}>Download file</a>
                <button type="button" className="font-semibold text-[#315e50] underline underline-offset-2" onClick={() => requestDownloadLink(currentJob.job_id)}>Generate a fresh link</button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="page-wrap footer">
        <div className="footer-top">
          <span>PageTranslateAI Document Translator · Your key, your document, your choice.</span>
          <div className="footer-links">
            <a href="https://pagetranslate.ai" target="_blank" rel="noreferrer">pagetranslate.ai</a>
            <a href="https://pagetranslate.ai/api" target="_blank" rel="noreferrer">API</a>
            <a href="https://pagetranslate.ai/privacy" target="_blank" rel="noreferrer">Privacy</a>
          </div>
        </div>
        <div className="footer-resource-groups">
          <section className="footer-resource-group" aria-labelledby="footer-online-heading">
            <h2 id="footer-online-heading">Online versions</h2>
            <p className="footer-resource-kicker">Prefer a browser?</p>
            <ul className="footer-resource-list">
              {ONLINE_VERSION_LINKS.map(({ label, href }) => (
                <li key={href}><a href={href} target="_blank" rel="noreferrer">{label}</a></li>
              ))}
            </ul>
          </section>
          <section className="footer-resource-group" aria-labelledby="footer-guides-heading">
            <h2 id="footer-guides-heading">Guides and free tools</h2>
            <ul className="footer-resource-list">
              {GUIDE_AND_TOOL_LINKS.map(({ label, href }) => (
                <li key={href}><a href={href} target="_blank" rel="noreferrer">{label}</a></li>
              ))}
            </ul>
          </section>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
