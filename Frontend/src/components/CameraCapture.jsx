import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SIDE = 1280; // keeps the JPEG well under the backend's 5 MB multer limit

function Corner({ className }) {
  return <span aria-hidden="true" className={`pointer-events-none absolute h-7 w-7 border-paint ${className}`} />;
}

/*
  Live camera only: there is deliberately no file picker, so every photo is
  taken on the spot. The capture is stamped with the time and GPS position.
*/
export default function CameraCapture({ photo, onCapture, onClear, stampText }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const run = useRef(0); // guards against React StrictMode starting two streams
  const [state, setState] = useState("starting"); // starting | live | error
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    const id = ++run.current;
    setError("");
    setState("starting");

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("The camera needs a secure connection. Open this site on localhost or over https.");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (id !== run.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      stop();
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      setState("live");
    } catch (err) {
      if (id !== run.current) return;
      const name = err?.name;
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Camera access is blocked. Allow the camera for this site in your browser settings, then try again."
          : name === "NotFoundError" || name === "OverconstrainedError"
            ? "No camera found on this device."
            : err?.message || "The camera couldn't start."
      );
      setState("error");
    }
  }, [stop]);

  useEffect(() => {
    start();
    return () => {
      run.current++;
      stop();
    };
  }, [start, stop]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Burn the time and position into the picture as visible proof it was taken here and now.
    const fontSize = Math.max(14, Math.round(canvas.width / 52));
    const barHeight = Math.round(fontSize * 2);
    const label = [new Date().toLocaleString(), stampText].filter(Boolean).join("   ");
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
    ctx.fillStyle = "#fff";
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(label, fontSize * 0.8, canvas.height - barHeight / 2);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        stop();
        onCapture({ file, url: URL.createObjectURL(blob) });
      },
      "image/jpeg",
      0.85
    );
  };

  const retake = () => {
    onClear();
    start();
  };

  const live = state === "live" && !photo;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-ink">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${live ? "" : "invisible"}`}
        />
        {photo && (
          <img src={photo.url} alt="Photo you took of the issue" className="pop absolute inset-0 h-full w-full object-cover" />
        )}

        {!photo && state !== "live" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-white/85">
            {state === "starting" ? (
              <p>Starting camera…</p>
            ) : (
              <p role="alert" className="max-w-xs">
                {error}
              </p>
            )}
          </div>
        )}

        {live && (
          <>
            <Corner className="left-3 top-3 border-l-4 border-t-4" />
            <Corner className="right-3 top-3 border-r-4 border-t-4" />
            <Corner className="bottom-3 left-3 border-b-4 border-l-4" />
            <Corner className="bottom-3 right-3 border-b-4 border-r-4" />
          </>
        )}
      </div>

      <div className="mt-3 flex min-h-[56px] items-center justify-between gap-3">
        <p className="max-w-[16rem] text-sm text-mute">
          {photo
            ? "Photo ready. Retake it if it doesn't show the problem clearly."
            : "Photos come straight from your camera, so every report shows what's there today."}
        </p>

        {photo ? (
          <button type="button" onClick={retake} className="rounded border border-ink/30 px-4 py-2 font-medium hover:bg-ink/5">
            Retake photo
          </button>
        ) : state === "live" ? (
          <button
            type="button"
            onClick={capture}
            aria-label="Take photo"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-ink bg-white transition-transform active:scale-95"
          >
            <span className="h-9 w-9 rounded-full bg-crit" />
          </button>
        ) : state === "error" ? (
          <button type="button" onClick={start} className="rounded bg-ink px-4 py-2 font-medium text-white hover:bg-ink/85">
            Try camera again
          </button>
        ) : null}
      </div>
    </div>
  );
}
