import { useAuth } from "../auth.jsx";
import { APP_NAME } from "../lib/constants.js";
import { Link, navigate } from "../lib/router.jsx";

function BrandMark() {
  return <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-blue-600 text-white shadow-md shadow-blue-200" aria-hidden="true">
    <svg width="25" height="25" viewBox="0 0 28 28" fill="none"><path d="M5 14.5 11 20l12-13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2.5a11.5 11.5 0 1 0 11.5 11.5" stroke="currentColor" strokeWidth="1.6" opacity=".65"/></svg>
  </span>;
}

function NavLink({ to, active, children }) {
  return <Link to={to} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>{children}</Link>;
}

export default function Navbar({ route }) {
  const { user, logout, isAdmin } = useAuth();
  const active = route === "/" ? "/" : route.startsWith("/complaints") ? "/complaints" : route;
  return <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div className="cf-page flex min-h-[68px] flex-wrap items-center gap-3 py-2 sm:min-h-[76px] sm:flex-nowrap sm:gap-5">
      <Link to="/" className="flex shrink-0 items-center gap-2.5 no-underline">
        <BrandMark />
        <span className="text-[21px] font-extrabold tracking-[-.055em] text-slate-900">Civic<span className="text-blue-600">Fix</span><span className="ml-1 hidden text-[10px] font-bold uppercase tracking-[.16em] text-slate-400 sm:inline">Community</span></span>
      </Link>
      <nav className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto pb-1 sm:order-none sm:ml-auto sm:w-auto sm:pb-0" aria-label="Main navigation">
        <NavLink to="/" active={active === "/"}>Home</NavLink>
        <NavLink to="/complaints" active={active === "/complaints"}>Explore issues</NavLink>
        {user && <NavLink to="/my-reports" active={active === "/my-reports"}>Your complaints</NavLink>}
        {user && isAdmin && <NavLink to="/admin" active={active === "/admin"}>Admin</NavLink>}
      </nav>
      <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
        {user ? <>
          <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-600 lg:block">{user.name}</span>
          <button onClick={async () => { navigate("/"); await logout(); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Sign out</button>
        </> : <>
          <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 no-underline hover:bg-slate-50">Sign in</Link>
          <Link to="/report" className="cf-primary !rounded-xl !px-4 !py-2.5 text-sm">Report an issue <span aria-hidden="true">↗</span></Link>
        </>}
      </div>
      <div className="sm:hidden">
        {user ? <button onClick={async () => { navigate("/"); await logout(); }} aria-label="Sign out" className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold">Exit</button> : <Link to="/login" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white no-underline">Sign in</Link>}
      </div>
    </div>
  </header>;
}
