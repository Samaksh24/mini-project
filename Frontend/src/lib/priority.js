// Tailwind needs complete class names, so every class is spelled out here.
export const TIERS = {
  critical: { key: "critical", label: "Critical", text: "text-crit", bg: "bg-crit", border: "border-crit" },
  high: { key: "high", label: "High", text: "text-high", bg: "bg-high", border: "border-high" },
  medium: { key: "medium", label: "Medium", text: "text-med", bg: "bg-med", border: "border-med" },
  low: { key: "low", label: "Low", text: "text-low", bg: "bg-low", border: "border-low" },
};

// Same thresholds the backend uses to build the priority score (0-100).
export function tierFor(priority) {
  if (priority >= 70) return TIERS.critical;
  if (priority >= 45) return TIERS.high;
  if (priority >= 25) return TIERS.medium;
  return TIERS.low;
}

// Used on the report result screen, where we only have severity and report count.
export function priorityOf(complaint) {
  if (typeof complaint.priority === "number") return complaint.priority;
  const severity = complaint.aiAnalysis?.severity ?? 5;
  const extra = Math.min(Math.max((complaint.duplicateCount || 1) - 1, 0), 10);
  return Math.round(Math.min(100, severity * 7 + extra * 3));
}

export function aiUnavailable(ai) {
  return !ai || (ai.confidence === 0 && ai.description === "AI analysis unavailable");
}

export function timeAgo(date) {
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

// ImageKit resizes on the fly with ?tr=w-400, which keeps the dashboard fast.
export function thumb(url, width = 400) {
  if (!url) return "";
  return `${url}${url.includes("?") ? "&" : "?"}tr=w-${width}`;
}
