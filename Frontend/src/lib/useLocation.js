import { useCallback, useEffect, useState } from "react";

// Reads the device's GPS position once on mount; call locate() to refresh it.
export function useLocation() {
  const [state, setState] = useState({ status: "loading", coords: null, error: "" });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: "error", coords: null, error: "This browser can't share your location." });
      return;
    }
    setState((prev) => ({ ...prev, status: "loading", error: "" }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "ok",
          error: "",
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        }),
      (err) =>
        setState({
          status: "error",
          coords: null,
          error:
            err.code === 1
              ? "Location is blocked. Allow location for this site in your browser, then update."
              : err.code === 3
                ? "Finding your location took too long. Try again, ideally outdoors."
                : "Couldn't find your location. Try again.",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { ...state, locate };
}
