"use client";

import { useState } from "react";
import { DEMO_AREAS } from "@/lib/places";
import { useAppState } from "@/lib/state";

export function AddressSheet({ onClose }: { onClose: () => void }) {
  const { address, setAddress } = useAppState();
  const [line, setLine] = useState(address?.line ?? "");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = (label: string, lat: number, lng: number) => {
    setAddress({ label, line: line.trim(), lat, lng });
    onClose();
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser cannot share its location.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        choose("Current location", pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setError("Location is off. Pick an area below instead.");
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Choose address" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Where should we deliver?</h2>
          <button className="ghost" onClick={onClose}>Close</button>
        </div>
        <label className="field">
          <span>Street and house number</span>
          <input
            autoFocus
            value={line}
            onChange={(e) => setLine(e.target.value)}
            placeholder="e.g. Luisenring 10"
            autoComplete="street-address"
          />
        </label>
        <button className="row-button" onClick={useDeviceLocation} disabled={locating}>
          ➤ {locating ? "Finding you…" : "Use my current location"}
        </button>
        {error && <p className="error small">{error}</p>}
        <h3 className="small muted">Demo areas</h3>
        <ul className="plain-list">
          {DEMO_AREAS.map((a) => (
            <li key={a.label}>
              <button className="row-button" onClick={() => choose(a.label, a.lat, a.lng)}>
                ◎ {a.label}
                {address?.label === a.label && <span className="muted small"> · current</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="muted small">
          Address search is coming. For now, pick an area or share your location and type your street for the courier.
        </p>
      </div>
    </div>
  );
}
