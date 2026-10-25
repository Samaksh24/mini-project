import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { CATEGORIES, STATUSES } from "../lib/constants.js";
import { tierFor, aiUnavailable } from "../lib/priority.js";
import StatusPill from "../components/StatusPill.jsx";
import { navigate } from "../lib/router.jsx";
import { useAuth } from "../auth.jsx";

const STATUS_COLORS = {
  "Pending": "#d97706",
  "Under Review": "#2563eb",
  "Resolved": "#15803d",
  "Rejected": "#64748b",
};
const formatDate = (value) => value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Date unavailable";
const cx = (...parts) => parts.filter(Boolean).join(" ");

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    alert: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3"/></>,
  };
  return <svg {...common}>{paths[name] || paths.file}</svg>;
}

function StatCard({ label, value, note, icon, accent = "blue" }) {
  const styles = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", green: "bg-emerald-50 text-emerald-700", red: "bg-rose-50 text-rose-700" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[.02]">
    <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-slate-500">{label}</p><span className={cx("grid h-10 w-10 place-items-center rounded-xl", styles[accent])}><Icon name={icon} size={19}/></span></div>
    <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p>
  </div>;
}

function AdminSidebar({ active, user, onLogout }) {
  const links = [{ label: "Overview", icon: "grid", key: "overview" }, { label: "Complaints", icon: "file", key: "complaints" }];
  return <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:border-b-0 lg:border-r">
    <div className="flex items-center gap-3 px-5 py-5 lg:px-6 lg:py-7"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#173d72] text-white"><Icon name="grid" size={22}/></span><div><p className="text-lg font-black tracking-tight text-slate-950">CivicFix</p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Control center</p></div></div>
    <div className="px-4 pb-4 lg:px-3"><p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">Workspace</p><nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Admin navigation">{links.map((item) => <button key={item.key} onClick={() => item.key === "complaints" ? document.getElementById("admin-complaints")?.scrollIntoView({ behavior: "smooth" }) : window.scrollTo({ top: 0, behavior: "smooth" })} className={cx("flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition", active === item.key ? "bg-blue-50 text-blue-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}><Icon name={item.icon}/>{item.label}</button>)}</nav></div>
    <div className="mt-auto hidden border-t border-slate-100 p-4 lg:block"><div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-800">{(user?.name || "A").slice(0,1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{user?.name || "Administrator"}</p><p className="text-xs text-slate-500">Administrator</p></div></div><button onClick={onLogout} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"><Icon name="logout" size={16}/> Sign out</button></div>
  </aside>;
}

function ComplaintDetails({ item, onClose, onChangeStatus, busy }) {
  const ai = item.aiAnalysis || {};
  const [nextStatus, setNextStatus] = useState(item.status);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { setNextStatus(item.status); setReason(""); setConfirming(false); }, [item._id, item.status]);
  const coords = item.location?.coordinates || [];
  const lng = coords[0], lat = coords[1];
  const noAI = aiUnavailable(ai);
  const tier = tierFor(item.priority ?? 0);
  const requestUpdate = () => { if (nextStatus !== item.status) setConfirming(true); };
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={(e) => { if (e.target === e.currentTarget && !confirming && !busy) onClose(); }}>
    <section className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7"><div className="min-w-0 pr-4"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-blue-700">Complaint details</p><h2 id="detail-title" className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{item.title}</h2><p className="mt-1 text-xs text-slate-500">ID: {item._id}</p></div><button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close details"><Icon name="close"/></button></div>
      <div className="grid gap-5 p-5 sm:grid-cols-[1.1fr_.9fr] sm:p-7">
        <div className="space-y-5"><div className="overflow-hidden rounded-2xl bg-slate-100">{item.image ? <a href={item.image} target="_blank" rel="noreferrer"><img src={item.image} alt={`Reported issue: ${item.title}`} className="max-h-[340px] w-full object-cover"/></a> : <div className="grid h-48 place-items-center text-sm text-slate-400">No image available</div>}</div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.description || ai.description || "No description was provided."}</p></div><div className="rounded-2xl border border-slate-200 p-4"><p className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Icon name="pin"/> Reported location</p>{lat != null && lng != null ? <><p className="mt-2 text-sm text-slate-600">Latitude {lat.toFixed(5)} · Longitude {lng.toFixed(5)}</p><a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue-700 hover:underline">Open in Google Maps ↗</a></> : <p className="mt-2 text-sm text-slate-500">Coordinates unavailable.</p>}</div></div>
        <div className="space-y-4"><div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Priority score</p><div className="mt-2 flex items-end justify-between gap-3"><p className="text-5xl font-black">{item.priority ?? "—"}<span className="text-lg text-slate-400">/100</span></p><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{tier.label}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.max(0, Math.min(100, item.priority || 0))}%` }}/></div><p className="mt-3 text-xs text-slate-400">{item.duplicateCount || 1} total report{(item.duplicateCount || 1) === 1 ? "" : "s"} · {formatDate(item.createdAt)}</p></div>
          <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-extrabold text-slate-900">AI analysis</p><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{noAI ? "Unavailable" : `${Math.round((ai.confidence || 0) * 100)}% confidence`}</span></div>{noAI ? <p className="mt-3 text-sm leading-5 text-slate-500">AI analysis was unavailable for this report.</p> : <><p className="mt-3 text-sm font-bold text-slate-800">{ai.detectedIssue || item.category}</p><p className="mt-1 text-sm leading-5 text-slate-600">{ai.description || "No AI description available."}</p><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="text-xs font-semibold text-slate-500">Severity</span><span className="text-lg font-black text-slate-900">{ai.severity ?? "—"}<span className="text-xs font-semibold text-slate-400"> / 10</span></span></div></>}</div>
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-extrabold text-slate-900">Manage status</p><div className="mt-3"><StatusPill status={item.status}/></div><label className="mt-4 block text-xs font-bold text-slate-500">New status<select value={nextStatus} onChange={(e) => { setNextStatus(e.target.value); setConfirming(false); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label><button disabled={nextStatus === item.status || busy} onClick={requestUpdate} className="mt-3 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">Review status change</button></div>
        </div>
      </div>
    </section>
    {confirming && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Icon name="alert" size={23}/></span><h3 id="confirm-title" className="mt-4 text-xl font-black text-slate-950">Confirm status update</h3><p className="mt-2 text-sm leading-6 text-slate-600">You're changing <strong>{item.title}</strong> from <strong>{item.status}</strong> to <strong>{nextStatus}</strong>. This change will be visible wherever this complaint is shown.</p><label className="mt-4 block text-xs font-bold text-slate-500">Reason (optional)<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder="Add a note to help you remember why…" className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/></label><p className="mt-2 text-xs leading-5 text-amber-700">This reason is not saved by the current backend; only the status will be updated.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button disabled={busy} onClick={() => setConfirming(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button disabled={busy} onClick={async () => { const ok = await onChangeStatus(item._id, nextStatus); if (ok) { setConfirming(false); onClose(); } }} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-60">{busy ? "Updating…" : "Confirm update"}</button></div></div></div>}
  </div>;
}

export default function Admin() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [trendRange, setTrendRange] = useState("week");
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "All", category: "All", priority: "All", sort: "priority" });

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const res = await api.getComplaints({ category: "All", status: "All" });
      const list = Array.isArray(res.complaints) ? res.complaints : [];
      setItems(list);
      setUpdatedAt(new Date());
      setSelected((current) => current ? (list.find((x) => x._id === current._id) || null) : null);
    } catch (e) { setError(e.message || "Could not load complaints."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const counts = Object.fromEntries(["Pending", "Under Review", "Resolved", "Rejected"].map((s) => [s, items.filter((x) => x.status === s).length]));
    const open = items.filter((x) => !["Resolved", "Rejected"].includes(x.status));
    const high = open.filter((x) => (x.priority || 0) >= 45).length;
    const categories = CATEGORIES.map((category) => ({ category, count: items.filter((x) => x.category === category).length })).sort((a,b) => b.count-a.count);
    const priorities = [{ label: "Critical", min: 70, max: 100, color: "bg-rose-500" }, { label: "High", min: 45, max: 69, color: "bg-orange-500" }, { label: "Medium", min: 25, max: 44, color: "bg-amber-500" }, { label: "Low", min: 0, max: 24, color: "bg-emerald-500" }].map((p) => ({ ...p, count: items.filter((x) => (x.priority || 0) >= p.min && (x.priority || 0) <= p.max).length }));
    const now = new Date();
    const trend = trendRange === "week"
      ? Array.from({ length: 7 }, (_, idx) => {
          const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (6 - idx));
          const end = new Date(start); end.setDate(end.getDate() + 1);
          return { label: start.toLocaleDateString([], { weekday: "short" }), count: items.filter((x) => { const d = new Date(x.createdAt); return d >= start && d < end; }).length };
        })
      : Array.from({ length: 6 }, (_, idx) => {
          const start = new Date(now.getFullYear(), now.getMonth() - 5 + idx, 1);
          const end = new Date(now.getFullYear(), now.getMonth() - 4 + idx, 1);
          return { label: start.toLocaleDateString([], { month: "short" }), count: items.filter((x) => { const d = new Date(x.createdAt); return d >= start && d < end; }).length };
        });
    return { total: items.length, counts, open: open.length, high, categories, priorities, trend };
  }, [items, trendRange]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const list = items.filter((item) => (!query || [item.title, item.description, item.category, item._id].some((v) => String(v || "").toLowerCase().includes(query))) && (filters.status === "All" || item.status === filters.status) && (filters.category === "All" || item.category === filters.category) && (filters.priority === "All" || (filters.priority === "Critical" ? item.priority >= 70 : filters.priority === "High" ? item.priority >= 45 && item.priority < 70 : filters.priority === "Medium" ? item.priority >= 25 && item.priority < 45 : item.priority < 25)));
    return list.sort((a,b) => filters.sort === "newest" ? new Date(b.createdAt)-new Date(a.createdAt) : filters.sort === "oldest" ? new Date(a.createdAt)-new Date(b.createdAt) : (b.priority || 0)-(a.priority || 0) || new Date(b.createdAt)-new Date(a.createdAt));
  }, [items, filters]);

  const updateStatus = async (id, status) => {
    setBusyId(id); setError("");
    try {
      await api.updateStatus(id, status); // Keep the existing API contract: only { status } is sent.
      await load(true);
      return true;
    } catch (e) { setError(e.message || "Could not update complaint status."); return false; }
    finally { setBusyId(null); }
  };

  const signOut = async () => { await logout(); navigate("/login"); };
  const maxTrend = Math.max(1, ...stats.trend.map((d) => d.count));
  const maxCategory = Math.max(1, ...stats.categories.map((d) => d.count));

  return <div className="min-h-screen bg-[#f4f7fb] text-slate-900 lg:flex">
    <AdminSidebar active="overview" user={user} onLogout={signOut}/>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl"><div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Operations / Overview</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Admin dashboard</h1></div><div className="flex items-center gap-2"><span className="hidden text-right sm:block"><span className="block text-sm font-bold">{user?.name || "Administrator"}</span><span className="block text-xs text-slate-500">CivicFix Admin</span></span><button onClick={() => load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Icon name="refresh" size={16}/><span className="hidden sm:inline">Refresh</span></button><button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white hover:bg-slate-700"><Icon name="logout" size={16}/><span className="hidden sm:inline">Sign out</span></button></div></div></header>
      <div className="mx-auto max-w-[1600px] space-y-7 p-5 sm:p-8">
        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><span>{error}</span><button onClick={() => load()} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white">Try again</button></div>}
        <section><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-black">Complaint overview</h2><p className="mt-1 text-sm text-slate-500">Live summary of all complaints available to the public complaint API.</p></div><span className="text-xs text-slate-400">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading data…"}</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total complaints" value={loading && !updatedAt ? "—" : stats.total} note={`${stats.open} currently open`} icon="file"/><StatCard label="Pending" value={loading && !updatedAt ? "—" : stats.counts.Pending} note="Awaiting action" icon="clock" accent="amber"/><StatCard label="High priority" value={loading && !updatedAt ? "—" : stats.high} note="Open complaints with priority ≥ 45" icon="alert" accent="red"/><StatCard label="Resolved" value={loading && !updatedAt ? "—" : stats.counts.Resolved} note={`${stats.counts.Rejected} rejected`} icon="check" accent="green"/></div></section>
        <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[.02] sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black">Complaints by category</h2><p className="mt-1 text-xs text-slate-500">Distribution across available reports</p></div><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{stats.total} total</span></div><div className="mt-5 space-y-4">{stats.categories.filter((x) => x.count > 0 || stats.total === 0).map((entry) => <div key={entry.category}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">{entry.category}</span><span className="font-bold text-slate-900">{entry.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${entry.count / maxCategory * 100}%` }}/></div></div>)}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[.02] sm:p-6"><h2 className="font-black">Priority distribution</h2><p className="mt-1 text-xs text-slate-500">Based on the existing priority score</p><div className="mt-5 space-y-4">{stats.priorities.map((p) => <div key={p.label}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">{p.label} <span className="font-normal text-slate-400">({p.min}{p.max < 100 ? `–${p.max}` : "+"})</span></span><span className="font-bold">{p.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cx("h-full rounded-full", p.color)} style={{ width: `${p.count / Math.max(1, stats.total) * 100}%` }}/></div></div>)}</div><div className="mt-5 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">Priority bands use the same thresholds as the complaint list. Scores are calculated by the existing backend.</div></div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[.02] sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black">Recent report trend</h2><p className="mt-1 text-xs text-slate-500">{trendRange === "week" ? "New complaints created each day over the last seven days." : "New complaints created per month over the last six months."}</p></div><label className="flex items-center gap-2 text-xs font-bold text-slate-600">Period<select value={trendRange} onChange={(e) => setTrendRange(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"><option value="week">Week</option><option value="month">Months</option></select></label></div><div className="mt-6 flex h-36 items-end justify-between gap-2 sm:gap-4">{stats.trend.map((d) => <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-bold text-slate-600">{d.count}</span><div className="flex h-[86px] w-full max-w-16 items-end overflow-hidden rounded-t-lg bg-slate-100"><div className="w-full rounded-t-lg bg-blue-600" style={{ height: `${d.count / maxTrend * 100}%`, minHeight: d.count ? "5px" : "0" }}/></div><span className="text-[11px] font-semibold text-slate-400">{d.label}</span></div>)}</div>{items.length === 0 && !loading && <p className="mt-3 text-xs text-slate-400">No complaints are available to plot yet.</p>}</section>
        <section id="admin-complaints" className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[.02]"><div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">Complaint management</h2><p className="mt-1 text-sm text-slate-500">Inspect reports, review AI analysis and update status with confirmation.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600">{filtered.length} results</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="relative sm:col-span-2 xl:col-span-2"><span className="sr-only">Search complaints</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search"/></span><input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Search title, description or ID…" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/></label><select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500"><option value="All">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select><select aria-label="Filter by category" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500"><option value="All">All categories</option>{CATEGORIES.map((s) => <option key={s}>{s}</option>)}</select><select aria-label="Sort complaints" value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500"><option value="priority">Highest priority</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select><select aria-label="Filter by priority" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500"><option value="All">All priorities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div></div>
          {loading ? <div className="space-y-3 p-5">{[1,2,3].map((x) => <div key={x} className="h-24 animate-pulse rounded-xl bg-slate-100"/>)}</div> : filtered.length === 0 ? <div className="p-12 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="search" size={22}/></span><h3 className="mt-4 font-black">No complaints found</h3><p className="mt-1 text-sm text-slate-500">Try changing your search or filters.</p></div> : <div className="divide-y divide-slate-100">{filtered.map((item) => { const tier = tierFor(item.priority || 0); const ai = item.aiAnalysis || {}; return <article key={item._id} className="grid gap-4 p-4 transition hover:bg-slate-50/70 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center sm:p-5"><div className="h-24 overflow-hidden rounded-xl bg-slate-100 sm:h-[76px]">{item.image ? <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-xs text-slate-400">No photo</div>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-600">{item.category}</span><StatusPill status={item.status}/><span className={cx("rounded-md px-2 py-1 text-[11px] font-extrabold", tier.key === "critical" ? "bg-rose-50 text-rose-700" : tier.key === "high" ? "bg-orange-50 text-orange-700" : tier.key === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>{tier.label} priority</span></div><h3 className="mt-2 truncate text-base font-extrabold text-slate-900">{item.title}</h3><p className="mt-1 line-clamp-1 text-sm text-slate-500">{ai.detectedIssue || item.description || ai.description || "No additional description"}</p><p className="mt-2 text-xs text-slate-400">{item.duplicateCount || 1} report{(item.duplicateCount || 1) === 1 ? "" : "s"} · {formatDate(item.createdAt)} · Severity {ai.severity ?? "—"}/10</p></div><div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2"><div className="text-right"><p className="text-2xl font-black leading-none text-slate-950">{item.priority ?? "—"}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority score</p></div><button onClick={() => setSelected(item)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800">Review details</button></div></article>; })}</div>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500"><span>Sorted by {filters.sort === "priority" ? "priority score" : filters.sort === "newest" ? "newest report" : "oldest report"}.</span><span>Only status changes are persisted by the current backend.</span></div>
        </section>
        <footer className="pb-2 text-center text-xs text-slate-400">CivicFix Control Center · Admin actions are protected by backend authorization.</footer>
      </div>
    </main>
    {selected && <ComplaintDetails item={selected} onClose={() => setSelected(null)} onChangeStatus={updateStatus} busy={busyId === selected._id}/>}
  </div>;
}
