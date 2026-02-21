import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar";
import TrackingMap from "./components/TrackingMap";
import { fetchTrackingData } from "./services/api";

const POLLING_INTERVAL = Number(import.meta.env.VITE_POLLING_INTERVAL) || 5000;

export default function App() {
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
        setError("Falha ao carregar dados de rastreamento.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, POLLING_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [loadData]);

  const handleSelectFlight = useCallback((id) => {
    // se vier null, limpa sempre
    if (id == null) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        trackings={trackings}
        selectedId={selectedId}
        onSelect={handleSelectFlight}
        error={error}
      />
      <div className="map-wrapper">
        {loading && <div className="loading-overlay">Carregando...</div>}
        <TrackingMap
          trackings={trackings}
          selectedId={selectedId}
          onMarkerClick={handleSelectFlight}
        />
      </div>
    </div>
  );
}
