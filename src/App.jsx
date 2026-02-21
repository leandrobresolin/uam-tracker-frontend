import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar";
import TrackingMap from "./components/TrackingMap";
import HistoricalData from "./pages/HistoricalData"; // ← só esta linha nova
import { fetchTrackingData } from "./services/api";

const POLLING_INTERVAL = Number(import.meta.env.VITE_POLLING_INTERVAL) || 5000;

export default function App() {
  const [currentView, setCurrentView] = useState("live");
  const [trackings, setTrackings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchTrackingData({ active: true });
      setTrackings(data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setTrackings([]);
        setError(null);
      } else {
        setError("Falha ao carregar dados.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentView !== "live") return; 

    loadData();
    intervalRef.current = setInterval(loadData, POLLING_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [loadData, currentView]); 

  const handleSelectFlight = useCallback((id) => {
    if (id == null) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      {/* Navegação simples */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "rgba(15, 23, 42, 0.95)",
          padding: "12px 20px",
          display: "flex",
          gap: "12px",
          zIndex: 10000,
          borderBottom: "1px solid #334155",
        }}
      >
        <button
          onClick={() => setCurrentView("live")}
          style={{
            padding: "8px 16px",
            background: currentView === "live" ? "#38bdf8" : "transparent",
            color: currentView === "live" ? "white" : "#94a3b8",
            border: "1px solid #334155",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🛩️ Live
        </button>
        <button
          onClick={() => setCurrentView("historical")}
          style={{
            padding: "8px 16px",
            background:
              currentView === "historical" ? "#38bdf8" : "transparent",
            color: currentView === "historical" ? "white" : "#94a3b8",
            border: "1px solid #334155",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          📊 History
        </button>
      </div>

      <div style={{ marginTop: "60px", height: "calc(100vh - 60px)" }}>
        {currentView === "live" ? (
          <div style={{ display: "flex", height: "100%" }}>
            <Sidebar
              trackings={trackings}
              selectedId={selectedId}
              onSelect={handleSelectFlight}
              error={error}
            />
            <div style={{ flex: 1, position: "relative" }}>
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "#1e293b",
                    color: "#38bdf8",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    zIndex: 1000,
                  }}
                >
                  Carregando...
                </div>
              )}
              <TrackingMap
                trackings={trackings}
                selectedId={selectedId}
                onMarkerClick={handleSelectFlight}
              />
            </div>
          </div>
        ) : (
          <HistoricalData />
        )}
      </div>
    </div>
  );
}
