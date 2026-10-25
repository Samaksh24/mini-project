import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { CATEGORIES, CLOSED_STATUSES, STATUSES } from "../lib/constants.js";
import StatusPill from "../components/StatusPill.jsx";
import { thumb } from "../lib/priority.js";
import { Link } from "../lib/router.jsx";

const dateLabel = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const statusDescription = {
  "Under Review": "Your report is being reviewed.",
  Pending: "This issue is awaiting action.",
  Resolved: "This issue has been marked as resolved.",
  Rejected: "This report was marked as rejected.",
};

function SummaryCard({ label, value, detail, icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return <div className="cf-card p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
      <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg font-bold ring-1 ${tones[tone]}`} aria-hidden="true">{icon}</span>
    </div>
  </div>;
}

function ComplaintDetails({ item, onClose }) {
  const coordinates = item.location?.coordinates || [];
  const [lng, lat] = coordinates;
  const ai = item.aiAnalysis;
  const hasAiSummary = Boolean(ai?.detectedIssue || ai?.description);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="complaint-detail-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
        <div><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-600">Complaint details</p><p className="mt-1 text-sm text-slate-500">Submitted {dateLabel(item.createdAt)}</p></div>
        <button type="button" onClick={onClose} aria-label="Close complaint details" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-xl text-slate-600 hover:bg-slate-50">×</button>
      </div>
      <div className="p-5 sm:p-6">
        {item.image && <a href={item.image} target="_blank" rel="noreferrer" className="mb-5 block overflow-hidden rounded-2xl bg-slate-100"><img src={thumb(item.image, 900)} alt={`Photo for ${item.title}`} className="max-h-72 w-full object-cover" /></a>}
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{item.category || "Other"}</span><StatusPill status={item.status} /><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{item.reportType || (item.submittedByMe ? "Submitted by you" : "You joined this report")}</span></div>
        <h2 id="complaint-detail-title" className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{item.title || "Untitled complaint"}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description || "No additional description was provided."}</p>

        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Current status</p>
          <div className="mt-2 flex items-start gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.status === "Resolved" ? "bg-emerald-500" : item.status === "Rejected" ? "bg-slate-400" : item.status === "Pending" ? "bg-amber-500" : "bg-blue-500"}`} /><div><p className="font-bold text-slate-900">{item.status || "Under Review"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{statusDescription[item.status] || "The current status is shown above."}</p></div></div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500"><span className="font-semibold text-slate-700">Timeline:</span> Submitted {dateLabel(item.createdAt)} · Current status: {item.status || "Under Review"}</div>
        </div>

        {hasAiSummary && <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-blue-700">✦</span><div><p className="font-bold text-slate-900">AI issue summary</p><p className="text-xs text-slate-500">Automated assessment, not an official verification</p></div></div>{ai.detectedIssue && <p className="mt-3 font-semibold text-slate-800">{ai.detectedIssue}</p>}{ai.description && <p className="mt-1 text-sm leading-6 text-slate-600">{ai.description}</p>}</div>}

        {lat != null && lng != null && <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer" className="cf-secondary mt-4 w-full sm:w-auto">↗ View complaint location on map</a>}
        <p className="mt-4 text-xs leading-5 text-slate-400">CivicFix shows the latest status available. A full status-change history is not available yet.</p>
      </div>
    </section>
  </div>;
}

export default function MyReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.getMyComplaints();
      setItems(Array.isArray(result.complaints) ? result.complaints : []);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message || "Could not load your complaints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => !CLOSED_STATUSES.includes(item.status)).length,
    review: items.filter((item) => item.status === "Under Review").length,
    resolved: items.filter((item) => item.status === "Resolved").length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter || (statusFilter === "Open" && !CLOSED_STATUSES.includes(item.status));
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchesSearch = !q || [item.title, item.description, item.category, item.aiAnalysis?.detectedIssue].some((value) => String(value || "").toLowerCase().includes(q));
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [items, statusFilter, categoryFilter, search]);

  return <div className="cf-page py-8 sm:py-12">
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-7 text-white shadow-xl shadow-blue-950/10 sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> PERSONAL TRACKING</span><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Your complaints, <span className="text-blue-300">in one place.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Follow issues you reported or joined, check their latest status, and see the details whenever you need them.</p></div>
        <Link to="/report" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900 no-underline transition hover:bg-blue-50">＋ Report an issue</Link>
      </div>
    </div>

    <section aria-label="Complaint summary" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard label="All complaints" value={loading ? "—" : counts.total} detail="Reports linked to you" icon="▤" tone="blue" />
      <SummaryCard label="Active issues" value={loading ? "—" : counts.active} detail="Awaiting final outcome" icon="◷" tone="amber" />
      <SummaryCard label="Under review" value={loading ? "—" : counts.review} detail="Being reviewed" icon="⌕" tone="slate" />
      <SummaryCard label="Resolved" value={loading ? "—" : counts.resolved} detail="Marked as fixed" icon="✓" tone="green" />
    </section>

    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">Your activity</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Complaint history</h2><p className="mt-1 text-sm text-slate-500">{loading ? "Loading your reports…" : `${filtered.length} of ${items.length} ${items.length === 1 ? "complaint" : "complaints"}`}</p></div><button onClick={load} disabled={loading} className="cf-secondary !rounded-xl !px-3 !py-2 text-sm disabled:cursor-wait disabled:opacity-60">↻ {loading ? "Refreshing…" : "Refresh"}</button></div>

      <div className="cf-card mt-5 grid gap-3 p-3 sm:grid-cols-[minmax(180px,1fr)_190px_190px] sm:p-4">
        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or description" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"><option value="All">All statuses</option><option value="Open">Active only</option>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Category</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"><option value="All">All categories</option>{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      </div>

      {error && <div role="alert" className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-red-800">We couldn't load your complaints</p><p className="mt-1 text-sm text-red-700">{error}</p></div><button onClick={load} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">Try again</button></div>}

      {loading && items.length === 0 ? <div className="mt-5 grid gap-4">{[0, 1, 2].map((n) => <div key={n} className="skeleton h-40 rounded-2xl" />)}</div> : !error && filtered.length === 0 ? <div className="cf-card mt-5 px-5 py-12 text-center sm:py-16"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-2xl text-blue-600">⌕</span><h3 className="mt-4 text-xl font-black text-slate-900">{items.length ? "No complaints match these filters" : "Your complaint list starts here"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{items.length ? "Try changing the status, category, or search terms." : "When you report an issue or join an existing report, it will appear here so you can track its status."}</p>{items.length ? <button onClick={() => { setStatusFilter("All"); setCategoryFilter("All"); setSearch(""); }} className="cf-secondary mt-5">Clear filters</button> : <Link to="/report" className="cf-primary mt-5">Report your first issue <span aria-hidden="true">↗</span></Link>}</div> : <div className="mt-5 grid gap-4">
        {filtered.map((item) => <article key={item._id} className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_5px_24px_rgba(27,67,130,.035)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5">
          <div className="flex flex-col sm:flex-row">
            {item.image ? <button type="button" onClick={() => setSelected(item)} aria-label={`View details for ${item.title}`} className="h-44 w-full shrink-0 overflow-hidden bg-slate-100 text-left sm:h-auto sm:min-h-[190px] sm:w-52"><img src={thumb(item.image, 480)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" /></button> : <div className="grid h-32 w-full shrink-0 place-items-center bg-slate-50 text-3xl text-slate-300 sm:min-h-[190px] sm:w-52">▧</div>}
            <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{item.category || "Other"}</span><StatusPill status={item.status} /></div>
              <h3 className="mt-3 text-xl font-extrabold leading-snug tracking-tight text-slate-900">{item.title || "Untitled complaint"}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description || item.aiAnalysis?.description || "No description was provided."}</p>
              {item.aiAnalysis?.detectedIssue && <p className="mt-2 text-xs text-slate-500"><span className="font-bold text-slate-600">AI identified:</span> {item.aiAnalysis.detectedIssue}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><span aria-hidden="true">▦</span> Submitted {dateLabel(item.createdAt)}</span><span className="inline-flex items-center gap-1.5"><span aria-hidden="true">◉</span> {item.reportType || (item.submittedByMe ? "Submitted by you" : "You joined this report")}</span></div>
            </div>
            <div className="flex items-center border-t border-slate-100 bg-slate-50/70 p-4 sm:w-44 sm:flex-col sm:items-stretch sm:justify-center sm:border-l sm:border-t-0 sm:p-5"><div className="min-w-0 flex-1 sm:flex-none"><p className="text-[11px] font-extrabold uppercase tracking-[.13em] text-slate-400">Current status</p><p className="mt-1 text-sm font-bold text-slate-800">{item.status || "Under Review"}</p></div><button type="button" onClick={() => setSelected(item)} className="ml-3 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 sm:ml-0 sm:mt-4">View details <span aria-hidden="true">↗</span></button></div>
          </div>
        </article>)}
      </div>}
      {updatedAt && !error && <p className="mt-5 text-center text-xs text-slate-400">Last refreshed at {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Refresh to check for status updates.</p>}
    </section>
    {selected && <ComplaintDetails item={selected} onClose={() => setSelected(null)} />}
  </div>;
}
