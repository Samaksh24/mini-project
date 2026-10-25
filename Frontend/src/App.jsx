import { useEffect } from "react";
import { useAuth } from "./auth.jsx";
import { navigate, useRoute } from "./lib/router.jsx";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import Report from "./pages/Report.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import MyReports from "./pages/MyReports.jsx";

export default function App() {
  const route = useRoute();
  const { user, isAdmin } = useAuth();
  const needsLogin = ["/report", "/my-reports", "/admin"].includes(route) && !user;
  const forbiddenAdmin = route === "/admin" && user && !isAdmin;

  useEffect(() => { if (needsLogin) navigate("/login"); }, [needsLogin]);
  useEffect(() => { if (forbiddenAdmin) navigate("/complaints"); }, [forbiddenAdmin]);
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  let page;
  if (route === "/") page = <Home />;
  else if (route === "/complaints") page = <Dashboard />;
  else if (route === "/report") page = user ? <Report /> : null;
  else if (route === "/login") page = <Login />;
  else if (route === "/my-reports" && user) page = <MyReports />;
  else if (route === "/admin" && isAdmin) return <Admin />;
  else page = <NotFound />;

  return <div className="min-h-screen bg-[#f6f9ff]">
    <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:font-semibold focus:text-slate-900">Skip to content</a>
    <Navbar route={route} />
    <main id="main" tabIndex={-1} className="min-h-[calc(100vh-76px)] outline-none">{page}</main>
  </div>;
}

function NotFound() {
  return <section className="cf-page py-20 text-center"><h1 className="text-4xl font-black text-slate-900">Page not found</h1><p className="mt-3 text-slate-600">That CivicFix page doesn't exist yet.</p><a className="cf-primary mt-6" href="#/">Back to home</a></section>;
}
