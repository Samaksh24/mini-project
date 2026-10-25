import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { navigate } from "../lib/router.jsx";

const inputClass =
  "mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-survey focus:ring-2 focus:ring-survey/30";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isRegister = mode === "register";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) {
        await register(form.name.trim(), form.email, form.password);
        navigate("/report");
      } else {
        const user = await login(form.email, form.password);
        navigate(user?.role === "Admin" ? "/admin" : "/report");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cf-page grid max-w-4xl gap-7 py-7 sm:py-10 md:grid-cols-[1fr_380px] md:gap-14">
      <div className="md:pt-6">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {isRegister ? "Create an account to report" : "Sign in to report an issue"}
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-ink/80 sm:text-lg">
          Reports are tied to an account so each person is counted once. When several residents report the same problem,
          it moves up the priority list.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-line bg-slab p-5 shadow-sm sm:p-6">
        {isRegister && (
          <label className="mb-4 block font-medium">
            Full name
            <input required autoComplete="name" value={form.name} onChange={set("name")} className={inputClass} />
          </label>
        )}
        <label className="mb-4 block font-medium">
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            className={inputClass}
          />
        </label>
        <label className="block font-medium">
          Password
          <input
            required
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={form.password}
            onChange={set("password")}
            className={inputClass}
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 rounded border border-crit/40 bg-crit/10 px-3 py-2 text-sm font-medium text-crit">
            {error}
          </p>
        )}

        <button
          disabled={busy}
          className="mt-5 w-full rounded bg-survey px-4 py-3 text-base font-semibold text-white hover:bg-survey-dark disabled:opacity-60"
        >
          {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-mute">
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? "login" : "register");
              setError("");
            }}
            className="font-semibold text-survey underline-offset-2 hover:underline"
          >
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </p>
      </form>
    </div>
  );
}
