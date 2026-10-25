import { Link } from "../lib/router.jsx";
import { CATEGORIES } from "../lib/constants.js";

const categoryMeta = {
  Road: { icon: "↗", tint: "#e8f1ff", ink: "#2c65ca", description: "Potholes, damaged roads and sidewalks" },
  Garbage: { icon: "♻", tint: "#e8f8ef", ink: "#17834e", description: "Overflowing bins and waste collection" },
  Water: { icon: "≈", tint: "#e5f5ff", ink: "#087db5", description: "Leaks, drainage and water supply" },
  Electricity: { icon: "ϟ", tint: "#fff5d9", ink: "#a66b00", description: "Power disruptions and exposed wires" },
  Streetlight: { icon: "☼", tint: "#fff0df", ink: "#bb6418", description: "Broken or missing streetlights" },
  "Traffic Signal": { icon: "●", tint: "#ffe9e9", ink: "#c83e47", description: "Signals and road safety equipment" },
  Other: { icon: "+", tint: "#f0eaff", ink: "#7650c8", description: "Other issues in your neighbourhood" },
};

function MiniReport({ label, title, location, status, color, priority }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-lg text-blue-600">{priority === "High" ? "!" : "⌖"}</span>
    <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</span><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${color}15`, color }}>{status}</span></div><p className="truncate text-sm font-extrabold text-slate-800">{title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{location}</p></div>
    <span className="hidden rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700 sm:inline">{priority} priority</span>
  </div>;
}

export default function Home() {
  return <div className="pb-16">
    <section className="cf-page relative overflow-hidden pb-10 pt-10 sm:pb-16 sm:pt-16">
      <div className="pointer-events-none absolute -right-12 top-5 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute left-[38%] top-24 h-48 w-48 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
        <div className="pop">
          <span className="cf-eyebrow"><span className="h-2 w-2 rounded-full bg-blue-600" /> A smarter way to improve your city</span>
          <h1 className="mt-6 max-w-[650px] text-[44px] font-black leading-[1.04] tracking-[-.065em] text-slate-950 sm:text-[60px] lg:text-[68px]">Your city.<br/>Your voice.<br/><span className="text-blue-600">Real change.</span></h1>
          <p className="mt-6 max-w-[540px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Spot a problem in your neighbourhood? Report it in minutes. CivicFix uses AI to understand civic issues and helps bring the most urgent problems into focus.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/report" className="cf-primary">Report an issue <span aria-hidden="true">→</span></Link>
            <Link to="/complaints" className="cf-secondary">Explore reported issues <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 sm:text-sm"><span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">✓</span>Photo-based reporting</span><span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">✓</span>AI-assisted analysis</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
          <div className="absolute -inset-4 rounded-[34px] bg-gradient-to-br from-blue-100 via-white to-indigo-100" />
          <div className="cf-card relative overflow-hidden !rounded-[28px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-blue-600">Civic pulse</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">Issues that need attention</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-600">⌁</span></div>
            <p className="mt-2 text-sm leading-6 text-slate-500">A clearer view of the problems people report around them.</p>
            <div className="mt-5 space-y-3">
              <MiniReport label="ROAD DAMAGE" title="Pothole near main crossing" location="Reported by the community" status="Needs attention" color="#c2410c" priority="High" />
              <MiniReport label="PUBLIC CLEANLINESS" title="Overflowing community bin" location="Community report" status="Under review" color="#2563eb" priority="Medium" />
              <MiniReport label="STREETLIGHT" title="Streetlight not working" location="Neighbourhood report" status="Pending" color="#a16207" priority="Medium" />
            </div>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-blue-50/80 p-4"><div><p className="text-sm font-extrabold text-slate-800">Every report helps.</p><p className="mt-1 text-xs leading-5 text-slate-500">Help your community get noticed.</p></div><Link to="/report" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-xl font-bold text-white no-underline shadow-md shadow-blue-200" aria-label="Create a report">+</Link></div>
            <p className="mt-3 text-center text-[10px] text-slate-400">Illustrative preview · Live issues are available in Explore issues</p>
          </div>
        </div>
      </div>
    </section>

    <section className="cf-page mt-5 sm:mt-10">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-blue-600">What can you report?</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950 sm:text-3xl">Small reports. Better neighbourhoods.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">From damaged roads to broken streetlights, help make local issues visible.</p></div><Link to="/report" className="cf-secondary self-start sm:self-auto">Start a report <span aria-hidden="true">→</span></Link></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category) => { const item = categoryMeta[category]; return <div key={category} className="cf-card group p-4 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/5"><span className="grid h-11 w-11 place-items-center rounded-[14px] text-xl font-bold" style={{ background: item.tint, color: item.ink }}>{item.icon}</span><h3 className="mt-4 font-extrabold text-slate-900">{category}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{item.description}</p></div>; })}
      </div>
    </section>

    <section className="cf-page mt-12 sm:mt-16"><div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-700 to-blue-600 px-6 py-8 text-white sm:px-10 sm:py-10"><div className="cf-grid-dots pointer-events-none absolute inset-0 opacity-20"/><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-blue-100">Be part of the solution</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">See something that needs fixing?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Share a photo and the location will be detected automatically. CivicFix helps turn local observations into actionable reports.</p></div><Link to="/report" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-blue-700 no-underline transition hover:bg-blue-50">Report a problem <span aria-hidden="true">→</span></Link></div></div></section>
    <footer className="cf-page mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-500 sm:flex-row"><span>© {new Date().getFullYear()} CivicFix · Better cities start with being heard.</span><Link to="/complaints" className="font-bold text-blue-700 no-underline">Browse public reports →</Link></footer>
  </div>;
}
