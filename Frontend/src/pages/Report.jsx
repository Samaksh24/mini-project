import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import CameraCapture from "../components/CameraCapture.jsx";
import SeverityMeter from "../components/SeverityMeter.jsx";
import { api } from "../lib/api.js";
import { CATEGORIES } from "../lib/constants.js";
import { aiUnavailable, priorityOf, tierFor } from "../lib/priority.js";
import { Link, navigate } from "../lib/router.jsx";
import { useLocation } from "../lib/useLocation.js";

const inputClass =
  "mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-base outline-none focus:border-survey focus:ring-2 focus:ring-survey/30";

function LocationRow({ loc }) {
  const { status, coords, error, locate } = loc;
  const weak = coords && coords.accuracy > 100;
  return (
    <div className="rounded border border-line bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${status === "ok" ? "bg-low" : status === "error" ? "bg-crit" : "animate-pulse bg-paint"}`}
            />
            {status === "ok" ? "Location found" : status === "error" ? "Location needed" : "Finding your location…"}
          </div>
          {coords && (
            <p className="mt-1 text-sm text-mute">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}, accurate to about {Math.round(coords.accuracy)} m
            </p>
          )}
          {weak && (
            <p className="mt-1 text-sm text-med">
              The position is rough. Move outdoors or use a phone for a tighter match with nearby reports.
            </p>
          )}
          {error && <p className="mt-1 text-sm text-crit">{error}</p>}
        </div>
        <button type="button" onClick={locate} className="shrink-0 rounded border border-ink/30 px-3 py-1.5 text-sm font-medium hover:bg-ink/5">
          Update location
        </button>
      </div>
    </div>
  );
}

function Result({ result, onAnother }) {
  const c = result.complaint;
  const merged = result._status === 200;
  const priority = priorityOf(c);
  const tier = tierFor(priority);
  const ai = c.aiAnalysis;
  const noAi = aiUnavailable(ai);

  return (
    <div className="pop mx-auto max-w-2xl">
      <h1 className="font-display text-5xl font-bold leading-[1.02] sm:text-6xl">
        {merged ? "Added to an existing report" : "Report filed"}
      </h1>
      <p className="mt-3 text-lg text-ink/80">
        {merged
          ? `Someone already reported this spot, so your report was counted with theirs. It now has ${c.duplicateCount} reports.`
          : "Your report is in the priority list. The AI has scored it from your photo."}
      </p>

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-slab">
        <div className="flex items-stretch">
          <div className={`w-2.5 shrink-0 ${tier.key === "critical" ? "stripe-critical" : tier.bg}`} aria-hidden="true" />
          <div className="flex-1 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-mute">{c.category}</p>
                <h2 className="font-display text-3xl font-semibold leading-tight">{c.title}</h2>
              </div>
              <div className="text-right">
                <div className={`font-display text-6xl font-bold leading-none ${tier.text}`}>{priority}</div>
                <div className="text-sm font-medium text-mute">priority, {tier.label.toLowerCase()}</div>
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              {noAi ? (
                <p className="text-mute">AI scoring was unavailable, so a default severity of 5 was used. A reviewer can still act on it.</p>
              ) : (
                <>
                  <SeverityMeter severity={ai.severity} priority={priority} />
                  <p className="mt-3">
                    <strong className="font-semibold">{ai.detectedIssue || "Issue detected"}.</strong> {ai.description}
                  </p>
                  <p className="mt-1 text-sm text-mute">AI confidence {Math.round((ai.confidence ?? 0) * 100)}%</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/" className="rounded bg-survey px-5 py-3 font-semibold text-white hover:bg-survey-dark">
          See the priority list
        </Link>
        <button onClick={onAnother} className="rounded border border-ink/30 px-5 py-3 font-semibold hover:bg-ink/5">
          Report another issue
        </button>
      </div>
    </div>
  );
}

export default function Report() {
  const { expire } = useAuth();
  const loc = useLocation();
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({ title: "", category: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0); // bumping this remounts the camera for a fresh report

  // free the preview URL when it is replaced or the page closes
  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const ready = photo && loc.coords && form.title.trim() && form.category;

  const missing = !photo
    ? "Take a photo"
    : !loc.coords
      ? "Allow location"
      : !form.title.trim()
        ? "Add a title"
        : !form.category
          ? "Choose a category"
          : "";

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    setNotice("");

    const data = new FormData();
    data.append("title", form.title.trim());
    data.append("category", form.category);
    if (form.description.trim()) data.append("description", form.description.trim());
    data.append("lat", String(loc.coords.lat));
    data.append("lng", String(loc.coords.lng));
    data.append("image", photo.file); // field name must match upload.single("image")

    try {
      setResult(await api.submitComplaint(data));
    } catch (err) {
      if (err.status === 401) {
        expire();
        navigate("/login");
        return;
      }
      // 409 means this person already reported the same spot; that's information, not a failure.
      if (err.status === 409) setNotice("You've already reported this issue. Each person is counted once per spot.");
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const another = () => {
    setResult(null);
    setPhoto(null);
    setForm({ title: "", category: "", description: "" });
    setNotice("");
    setError("");
    setRound((n) => n + 1);
    loc.locate();
  };

  if (result) return <Result result={result} onAnother={another} />;

  const stamp = loc.coords ? `${loc.coords.lat.toFixed(5)}, ${loc.coords.lng.toFixed(5)}` : "";

  return (
    <div className="cf-page py-6 sm:py-9">
      <div className="mb-6 rounded-2xl border border-line bg-white px-5 py-6 sm:px-7 sm:py-7">
      <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Report an issue</h1>
      <p className="mt-2 max-w-xl text-base leading-7 text-ink/80 sm:text-lg">Take a photo at the spot. We add your location automatically.</p>
      </div>
      <form onSubmit={submit} className="mt-7 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <CameraCapture
          key={round}
          photo={photo}
          onCapture={setPhoto}
          onClear={() => setPhoto(null)}
          stampText={stamp}
        />

        <div className="space-y-5">
          <fieldset>
            <legend className="font-medium">Category</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={form.category === c}
                  onClick={() => setForm((f) => ({ ...f, category: c }))}
                  className={`rounded border px-3.5 py-2 font-medium ${
                    form.category === c ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block font-medium">
            Title
            <input
              required
              maxLength={80}
              value={form.title}
              onChange={set("title")}
              placeholder="Deep pothole near the bus stop"
              className={inputClass}
            />
          </label>

          <label className="block font-medium">
            Details <span className="font-normal text-mute">(optional)</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="Anything that helps the crew find it"
              className={inputClass}
            />
          </label>

          <LocationRow loc={loc} />

          {notice && (
            <p role="status" className="rounded border border-survey/40 bg-survey/10 px-3 py-2 text-sm font-medium text-survey-dark">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded border border-crit/40 bg-crit/10 px-3 py-2 text-sm font-medium text-crit">
              {error}
            </p>
          )}

          <div>
            <button
              disabled={!ready || busy}
              className="w-full rounded bg-survey px-5 py-3.5 text-lg font-semibold text-white hover:bg-survey-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Analysing your photo… Please wait" : "Submit report"}
            </button>
            {missing && !busy && <p className="mt-2 text-sm text-mute">{missing} to continue.</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
