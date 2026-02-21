import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getAircraftIcon } from "../utils/icons";
import { fetchWaypoints } from "../services/api";

const DEFAULT_CENTER = [-23.6261, -46.6566]; // Congonhas
const DEFAULT_ZOOM = 12;

function FlyToSelected({ trackings, selectedId }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const t = trackings.find((tr) => tr.id === selectedId);
    if (t) {
      map.flyTo([t.latitude, t.longitude], 14, { duration: 1 });
    }
  }, [selectedId, trackings, map]);

  return null;
}

function AircraftPopup({ tracking }) {
  const t = tracking;
  const fi = t.flight_instance;
  const ac = fi.aircraft;

  return (
    <div className="popup-content">
      <h3>{fi.callsign || ac.tail_number}</h3>
      <div className="popup-grid">
        <span className="popup-label">Tail Number:</span>
        <span className="popup-value">{ac.tail_number}</span>

        <span className="popup-label">Tipo:</span>
        <span className="popup-value">
          {ac.aircraft_type?.name || "—"}
          {ac.aircraft_type?.manufacturer
            ? ` (${ac.aircraft_type.manufacturer})`
            : ""}
        </span>

        <span className="popup-label">Modelo:</span>
        <span className="popup-value">
          {ac.aircraft_type?.model_type || "—"}
        </span>

        <span className="popup-label">Energia:</span>
        <span className="popup-value">
          {ac.aircraft_type?.energy_type || "—"}
        </span>

        <span className="popup-label">Status:</span>
        <span className="popup-value">{fi.flight_status}</span>

        <span className="popup-label">Altitude:</span>
        <span className="popup-value">{t.altitude.toFixed(0)} ft</span>

        <span className="popup-label">Velocidade:</span>
        <span className="popup-value">{t.speed.toFixed(0)} kts</span>

        <span className="popup-label">Nível Energia:</span>
        <span className="popup-value">{t.energy_level.toFixed(1)}</span>

        {fi.departure_vertiport && (
          <>
            <span className="popup-label">Partida:</span>
            <span className="popup-value">
              {fi.departure_vertiport.vertiport_name} (
              {fi.departure_vertiport.vertiport_code})
            </span>
          </>
        )}

        {fi.arrival_vertiport && (
          <>
            <span className="popup-label">Chegada:</span>
            <span className="popup-value">
              {fi.arrival_vertiport.vertiport_name} (
              {fi.arrival_vertiport.vertiport_code})
            </span>
          </>
        )}

        {fi.route && (
          <>
            <span className="popup-label">Rota:</span>
            <span className="popup-value">{fi.route.name}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrackingMap({ trackings, selectedId, onMarkerClick }) {
  const markerRefs = useRef({});
  const waypointsCache = useRef(new Map()); // cache para evitar chamadas repetidas
  const [waypoints, setWaypoints] = useState([]);

  // ESC para limpar seleção
  const handleEsc = useCallback(
    (event) => {
      if (event.key === "Escape") {
        onMarkerClick(null);
      }
    },
    [onMarkerClick]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  // Buscar waypoints quando seleciona uma aeronave com rota
  useEffect(() => {
    if (!selectedId) {
      setWaypoints([]);
      return;
    }

    const selected = trackings.find((t) => t.id === selectedId);
    if (!selected?.flight_instance?.route?.id) {
      setWaypoints([]);
      return;
    }

    const routeId = selected.flight_instance.route.id;
    const cached = waypointsCache.current.get(routeId);

    if (cached) {
      setWaypoints(cached);
      return;
    }

    fetchWaypoints(routeId)
      .then((data) => {
        waypointsCache.current.set(routeId, data);
        setWaypoints(data);
      })
      .catch((err) => {
        console.error("Erro ao buscar waypoints:", err);
        setWaypoints([]);
      });
  }, [selectedId, trackings]);

  // Abrir popup quando seleciona
  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId].openPopup();
    }
  }, [selectedId]);

  // Tracking atual selecionado
  const selectedTracking = useMemo(
    () => trackings.find((t) => t.id === selectedId) || null,
    [trackings, selectedId]
  );

  // Trilha real (tracking points) do voo selecionado
  const { pathPositions, departurePos, arrivalPos } = useMemo(() => {
    if (!selectedTracking) {
      return { pathPositions: [], departurePos: null, arrivalPos: null };
    }

    const flightId = selectedTracking.flight_instance.id;
    const sameFlightPoints = trackings.filter(
      (t) => t.flight_instance.id === flightId
    );

    if (sameFlightPoints.length === 0) {
      return { pathPositions: [], departurePos: null, arrivalPos: null };
    }

    const ordered = sameFlightPoints
      .slice()
      .sort(
        (a, b) =>
          new Date(a.started_at).getTime() -
          new Date(b.started_at).getTime()
      );

    const positions = ordered.map((p) => [p.latitude, p.longitude]);
    const first = ordered[0];
    const last = ordered[ordered.length - 1];

    return {
      pathPositions: positions,
      departurePos: [first.latitude, first.longitude],
      arrivalPos: [last.latitude, last.longitude],
    };
  }, [trackings, selectedTracking]);

  // Rota planejada (waypoints)
  const routePositions = useMemo(() => {
    if (waypoints.length === 0) return [];
    return waypoints.map((wp) => [wp.latitude, wp.longitude]);
  }, [waypoints]);

  // Se não tem route mas tem vertiports, linha tracejada direta
  const directRoute = useMemo(() => {
    if (!selectedTracking) return null;

    const fi = selectedTracking.flight_instance;
    const dep = fi.departure_vertiport?.latitude && fi.departure_vertiport?.longitude
      ? [[fi.departure_vertiport.latitude, fi.departure_vertiport.longitude]]
      : null;
    const arr = fi.arrival_vertiport?.latitude && fi.arrival_vertiport?.longitude
      ? [[fi.arrival_vertiport.latitude, fi.arrival_vertiport.longitude]]
      : null;

    return dep && arr ? [dep[0], arr[0]] : null;
  }, [selectedTracking]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* FlyTo (comente se não quiser zoom automático)
      <FlyToSelected trackings={trackings} selectedId={selectedId} />
      */}

      {/* Trilha real percorrida (tracking) */}
      {pathPositions.length > 1 && (
        <Polyline
          positions={pathPositions}
          pathOptions={{
            color: "#38bdf8", // azul forte
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}

      {/* Pontos real: partida/chegada */}
      {departurePos && (
        <CircleMarker
          center={departurePos}
          radius={6}
          pathOptions={{
            color: "#22c55e",
            fillColor: "#22c55e",
            fillOpacity: 1,
          }}
        />
      )}
      {arrivalPos && (
        <CircleMarker
          center={arrivalPos}
          radius={6}
          pathOptions={{
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 1,
          }}
        />
      )}

      {/* ROTA PLANEJADA (waypoints) - só se tem route */}
      {routePositions.length > 1 && (
        <>
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: "#10b981", // verde claro
              weight: 3,
              opacity: 0.6,
              dashArray: "10, 10", // tracejado fraquinho
            }}
          />
          {/* Waypoints numerados */}
          {waypoints.map((wp, idx) => (
            <CircleMarker
              key={wp.id}
              center={[wp.latitude, wp.longitude]}
              radius={5}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <strong>{wp.sequence_order}</strong>: {wp.name}
                {wp.vertiport_code && ` (${wp.vertiport_code})`}
                <br />
                {wp.altitude} ft
              </Popup>
            </CircleMarker>
          ))}
        </>
      )}

      {/* Linha direta tracejada se tem vertiports mas sem route */}
      {selectedTracking &&
  !selectedTracking.flight_instance.route &&
  directRoute &&
  directRoute.length === 2 && (
    <Polyline
      positions={directRoute}
      pathOptions={{
        color: "#9ca3af", // cinza claro
        weight: 2,
        opacity: 0.5,
        dashArray: "15, 10", // tracejado
      }}
    />
  )}

      {/* Marcadores das aeronaves */}
      {trackings.map((t) => {
        const modelType = t.flight_instance.aircraft.aircraft_type?.model_type;
        const icon = getAircraftIcon(modelType);

        return (
          <Marker
            key={t.id}
            position={[t.latitude, t.longitude]}
            icon={icon}
            ref={(ref) => {
              if (ref) markerRefs.current[t.id] = ref;
            }}
            eventHandlers={{
              click: () => onMarkerClick(t.id),
            }}
          >
            <Popup className="aircraft-popup" maxWidth={320}>
              <AircraftPopup tracking={t} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
