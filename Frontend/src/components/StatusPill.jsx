const STYLES = {
  "Under Review": "bg-survey/10 text-survey-dark border-survey/30",
  Pending: "bg-paint/25 text-ink border-paint",
  Resolved: "bg-low/10 text-low border-low/40",
  Rejected: "bg-line/60 text-mute border-line",
};

export default function StatusPill({ status }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${STYLES[status] || STYLES.Rejected}`}>
      {status}
    </span>
  );
}
