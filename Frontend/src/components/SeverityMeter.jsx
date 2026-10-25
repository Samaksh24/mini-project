import { tierFor } from "../lib/priority.js";

// Ten road-stud style segments; lit ones are coloured by the complaint's priority tier.
export default function SeverityMeter({ severity, priority }) {
  const lit = Math.round(Math.max(0, Math.min(10, severity)));
  const tier = tierFor(priority);
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Severity ${lit} out of 10`}>
      <div className="flex gap-[3px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-4 w-2 rounded-[2px] ${i < lit ? tier.bg : "bg-line"}`} />
        ))}
      </div>
      <span className="whitespace-nowrap text-sm font-medium text-mute">{lit} of 10</span>
    </div>
  );
}
