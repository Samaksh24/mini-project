import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import ComplaintCard from "../components/ComplaintCard.jsx";
import { api } from "../lib/api.js";
import { CATEGORIES, CLOSED_STATUSES } from "../lib/constants.js";
import { tierFor } from "../lib/priority.js";
import { Link } from "../lib/router.jsx";

const REFRESH_MS = 30000;

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-44 rounded-md" />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState({ category: "All", status: "Open" });
  const [data, setData] = useState({ items: [], loading: true, error: "", updated: null });
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    async (silent) => {
      if (!silent) setData((d) => ({ ...d, loading: true, error: "" }));
      try {
        const res = await api.getComplaints(filters);
        setData({ items: res.complaints, loading: false, error: "", updated: new Date() });
      } catch (err) {
        // keep the last good list on screen if a background refresh fails
        setData((d) => ({ ...d, loading: false, error: silent ? d.error : err.message }));
      }
    },
    [filters]
  );

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const changeStatus = async (id, status) => {
    setBusyId(id);
    try {
      await api.updateStatus(id, status);
      await load(true);
    } catch (err) {
      setData((d) => ({ ...d, error: err.message }));
    } finally {
      setBusyId(null);
    }
  };

  const open = data.items.filter((i) => !CLOSED_STATUSES.includes(i.status));
  const critical = open.filter((i) => tierFor(i.priority).key === "critical").length;
  const reports = open.reduce((sum, i) => sum + (i.duplicateCount || 1), 0);
  const first = data.loading && !data.updated;

  return (
    <div className="cf-page py-6 sm:py-9">
      <header className="rounded-2xl border border-line bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-8">
        {first ? (
          <div className="skeleton h-10 w-3/4 max-w-xl rounded" aria-hidden="true" />
        ) : (
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {critical > 0
              ? `${critical} ${critical === 1 ? "issue needs" : "issues need"} a response now`
              : open.length > 0
                ? "Nothing critical right now"
                : "No open issues"}
          </h1>
        )}
        <p className="mt-2 text-base leading-7 text-ink/80 sm:text-lg">
          {first ? "Loading the list…" : `${open.length} open ${open.length === 1 ? "issue" : "issues"}, ${reports} ${reports === 1 ? "report" : "reports"} from residents. Most urgent first.`}
        </p>
      </header>

      <section aria-label="Filters" className="mt-5 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              aria-pressed={filters.category === c}
              onClick={() => setFilters((f) => ({ ...f, category: c }))}
              className={`rounded border px-3 py-1.5 text-[15px] font-medium ${
                filters.category === c ? "border-ink bg-ink text-white" : "border-line bg-slab hover:border-ink/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <label className="flex items-center gap-2 font-medium">
            Show
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="min-h-10 max-w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal"
            >
              <option value="Open">Open issues</option>
              <option value="Under Review">Under review</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
              <option value="All">Everything</option>
            </select>
          </label>
          <button onClick={() => load(false)} className="min-h-10 rounded-lg border border-ink/30 px-4 py-2 font-medium hover:bg-ink/5">
            Refresh
          </button>
        </div>
      </section>

      <section className="mt-6" aria-live="polite">
        {data.error && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-crit/40 bg-crit/10 px-4 py-3 text-crit">
            <span className="font-medium">{data.error}</span>
            <button onClick={() => load(false)} className="rounded bg-crit px-3 py-1.5 text-sm font-semibold text-white">
              Try again
            </button>
          </div>
        )}

        {first ? (
          <Skeleton />
        ) : data.items.length === 0 && !data.error ? (
          <div className="rounded-2xl border border-dashed border-ink/30 bg-white px-5 py-12 text-center sm:px-6 sm:py-14">
            <p className="font-display text-2xl font-semibold sm:text-3xl">No issues match these filters</p>
            <p className="mt-2 text-mute">Spotted something? A single photo is enough to start.</p>
            <Link to="/report" className="mt-5 inline-block rounded bg-survey px-5 py-3 font-semibold text-white hover:bg-survey-dark">
              Report an issue
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((item) => (
              <ComplaintCard key={item._id} item={item} isAdmin={isAdmin} busy={busyId === item._id} onStatusChange={changeStatus} />
            ))}
          </div>
        )}

        {data.updated && (
          <p className="mt-6 text-sm text-mute">
            Updated {data.updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. The list refreshes every 30 seconds.
          </p>
        )}
      </section>
    </div>
  );
}
