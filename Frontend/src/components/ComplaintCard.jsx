import { STATUSES } from "../lib/constants.js";
import { aiUnavailable, thumb, tierFor, timeAgo } from "../lib/priority.js";
import SeverityMeter from "./SeverityMeter.jsx";
import StatusPill from "./StatusPill.jsx";

export default function ComplaintCard({ item, isAdmin, onStatusChange, busy }) {
  const tier = tierFor(item.priority);
  const ai = item.aiAnalysis;
  const noAi = aiUnavailable(ai);
  const [lng, lat] = item.location?.coordinates ?? [];
  const reports = item.duplicateCount || 1;
  const critical = tier.key === "critical";
  const closed = item.status === "Resolved" || item.status === "Rejected";

  return (
    <article
      className={`flex overflow-hidden rounded-md border border-line bg-slab ${closed ? "opacity-70" : ""}`}
      aria-label={`${item.title}, priority ${item.priority}, ${tier.label}`}
    >
      {/* painted stripe: dashed for critical, solid for the rest */}
      <div className={`w-2 shrink-0 sm:w-2.5 ${critical ? "stripe-critical" : tier.bg}`} aria-hidden="true" />

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <a
          href={item.image}
          target="_blank"
          rel="noreferrer"
          className="block h-44 shrink-0 overflow-hidden rounded bg-line sm:h-32 sm:w-44"
          aria-label={`Open full photo for ${item.title}`}
        >
          <img src={thumb(item.image, 480)} alt="" loading="lazy" className="h-full w-full object-cover" />
        </a>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {critical && !closed && <span className="rounded bg-crit px-2 py-0.5 text-xs font-semibold text-white">Respond now</span>}
            <span className="rounded border border-line bg-white px-2 py-0.5 text-xs font-semibold">{item.category}</span>
            <StatusPill status={item.status} />
          </div>

          <h3 className="mt-2 font-display text-xl font-semibold leading-tight sm:text-2xl">{item.title}</h3>

          {noAi ? (
            <p className="mt-1 text-sm text-mute">AI scoring was unavailable for this report, so a default severity was used.</p>
          ) : (
            <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-ink/80">
              {ai.detectedIssue ? <strong className="font-semibold">{ai.detectedIssue}. </strong> : null}
              {ai.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mute">
            <span className="font-semibold text-ink">
              {reports} {reports === 1 ? "report" : "reports"}
            </span>
            <span>{timeAgo(item.createdAt)}</span>
            {lat != null && (
              <a
                className="font-medium text-survey underline-offset-2 hover:underline"
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
              >
                View on map
              </a>
            )}
            {isAdmin && (
              <label className="flex items-center gap-2">
                <span>Status</span>
                <select
                  value={item.status}
                  disabled={busy}
                  onChange={(e) => onStatusChange(item._id, e.target.value)}
                  className="rounded border border-line bg-white px-2 py-1 text-ink disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 border-t border-line pt-3 sm:w-48 sm:flex-col sm:items-end sm:justify-center sm:gap-1 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="sm:text-right">
            <div className={`font-display text-4xl font-bold leading-none sm:text-5xl ${tier.text}`}>{item.priority}</div>
            <div className="text-sm font-medium text-mute">priority, {tier.label.toLowerCase()}</div>
          </div>
          {!noAi && (
            <div className="ml-auto sm:ml-0 sm:mt-2">
              <SeverityMeter severity={ai.severity} priority={item.priority} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
