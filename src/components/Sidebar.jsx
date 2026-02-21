import React from "react";

function getEnergyClass(level) {
  if (level >= 60) return "energy-high";
  if (level >= 30) return "energy-mid";
  return "energy-low";
}

function formatSpeed(speed) {
  return `${speed.toFixed(0)} kts`;
}

function formatAltitude(alt) {
  return `${alt.toFixed(0)} ft`;
}

export default function Sidebar({ trackings, selectedId, onSelect, error }) {
  const activeCount = trackings.filter(
    (t) => t.flight_instance.flight_status === "ACTIVATED"
  ).length;

  const avgEnergy =
    trackings.length > 0
      ? (
          trackings.reduce((sum, t) => sum + t.energy_level, 0) /
          trackings.length
        ).toFixed(0)
      : 0;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>🛩️ UAM Tracker</h1>
        <div className="subtitle">
          Urban Air Mobility — Monitoramento em Tempo Real
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{trackings.length}</div>
          <div className="stat-label">Rastreados</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Em Voo</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{avgEnergy}</div>
          <div className="stat-label">Energia Média</div>
        </div>
      </div>

      <div className="flight-list">
        {trackings.length === 0 && !error && (
          <p style={{ textAlign: "center", color: "#64748b", marginTop: 40 }}>
            Nenhuma aeronave rastreada no momento.
          </p>
        )}
        {trackings.map((t) => {
          const fi = t.flight_instance;
          const ac = fi.aircraft;
          return (
            <div
              key={t.id}
              className={`flight-card ${
                selectedId === t.id ? "selected" : ""
              }`}
              onClick={() => onSelect(t.id)}
            >
              <div className="flight-card-header">
                <span className="callsign">
                  {fi.callsign || ac.tail_number}
                </span>
                <span className={`status-badge status-${fi.flight_status}`}>
                  {fi.flight_status}
                </span>
              </div>

              <div className="flight-card-details">
                <div className="detail-item">
                  <span className="detail-label">Aeronave</span>
                  <span className="detail-value">{ac.tail_number}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tipo</span>
                  <span className="detail-value">
                    {ac.aircraft_type?.name || "—"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Altitude</span>
                  <span className="detail-value">
                    {formatAltitude(t.altitude)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Velocidade</span>
                  <span className="detail-value">
                    {formatSpeed(t.speed)}
                  </span>
                </div>
              </div>

              {fi.departure_vertiport && fi.arrival_vertiport && (
                <div className="route-info">
                  <span>{fi.departure_vertiport.vertiport_code}</span>
                  <span className="arrow">→</span>
                  <span>{fi.arrival_vertiport.vertiport_code}</span>
                  {fi.route && (
                    <span style={{ marginLeft: "auto", color: "#64748b" }}>
                      ({fi.route.name})
                    </span>
                  )}
                </div>
              )}

              <div className="energy-bar-container">
                <div
                  className={`energy-bar ${getEnergyClass(t.energy_level)}`}
                  style={{ width: `${Math.min(t.energy_level, 100)}` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
