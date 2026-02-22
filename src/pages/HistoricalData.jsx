import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { fetchAircraftData } from "../services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";

export default function HistoricalData() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtros
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const response = await fetchAircraftData();
      setAllData(response);
    } catch (err) {
      setError("Falha ao carregar dados base");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (selectedAircraft) filters.aircraft = selectedAircraft;
      if (startDate) filters.created_from = startDate + "T00:00:00Z";
      if (endDate) filters.created_to = endDate + "T23:59:59Z";

      const response = await fetchAircraftData(filters);
      setFilteredData(response);
    } catch (err) {
      if (err.response?.status === 404) {
        setFilteredData([]);
        setError(null);
      } else {
        setError("Erro ao aplicar filtros");
      }
    } finally {
      setLoading(false);
    }
  };

  const aircraftOptions = useMemo(() => {
    return [
      ...new Set(allData.map((d) => d.flight_instance.aircraft.tail_number)),
    ];
  }, [allData]);

  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];

    const sorted = filteredData
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Calcula média móvel simples para tendência (janela 3 pontos)
    const energySmooth = sorted.map((d, idx) => {
      const windowStart = Math.max(0, idx - 1);
      const windowEnd = Math.min(sorted.length, idx + 2);
      const window = sorted.slice(windowStart, windowEnd);
      return (
        window.reduce((sum, p) => sum + (p.energy_level || 0), 0) /
        window.length
      );
    });

    return sorted.map((d, idx) => ({
      time: new Date(d.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      altitude: d.altitude || 0,
      speed: d.speed || 0,
      energy: d.energy_level || 0,
      energySmooth: energySmooth[idx], // ← tendência suavizada
    }));
  }, [filteredData]);

  const stats = useMemo(() => {
    const altitudes = filteredData.map((d) => d.altitude || 0).filter(Boolean);
    const speeds = filteredData.map((d) => d.speed || 0).filter(Boolean);
    const energies = filteredData
      .map((d) => d.energy_level || 0)
      .filter(Boolean);
    const firstEnergy = energies[0] || 0;
    const lastEnergy = energies[energies.length - 1] || 0;
    const totalConsumption = firstEnergy - lastEnergy;

    // Duração aproximada (em horas)
    const firstTime = new Date(filteredData[0]?.created_at);
    const lastTime = new Date(
      filteredData[filteredData.length - 1]?.created_at,
    );
    const durationHours = (lastTime - firstTime) / (1000 * 60 * 60);

    return {
      totalRecords: filteredData.length,
      avgAltitude: altitudes.length
        ? (altitudes.reduce((a, b) => a + b, 0) / altitudes.length).toFixed(0)
        : 0,
      maxSpeed: speeds.length ? Math.max(...speeds).toFixed(0) : 0,
      avgEnergy: energies.length
        ? (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1)
        : 0,
      avgEnergyInitial: firstEnergy.toFixed(1),
      avgEnergyFinal: lastEnergy.toFixed(1),
      totalConsumption: Math.round(firstEnergy - lastEnergy),
      consumptionRate: Math.round(
        totalConsumption / Math.max(durationHours, 0.1),
      ),
      flightDuration: durationHours,
    };
  }, [filteredData]);

  const hasFilters = selectedAircraft || startDate || endDate;

  return (
    <div className="historical-container">
      <header className="historical-header">
        <h1>📊 Dashboard Histórico Aeronaves</h1>

        <div className="filters-row">
          <select
            value={selectedAircraft}
            onChange={(e) => setSelectedAircraft(e.target.value)}
            className="filter-select"
          >
            <option value="">Selecione Aeronave</option>
            {aircraftOptions.map((tail) => (
              <option key={tail} value={tail}>
                {tail}
              </option>
            ))}
          </select>

          <div className="date-filters">
            <DatePicker
              selected={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split("T")[0] : "")
              }
              dateFormat="dd/MM/yyyy"
              locale={ptBR}
              className="date-input"
              placeholderText="dd/mm/yyyy"
            />
            <span className="date-separator">até</span>
            <DatePicker
              selected={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split("T")[0] : "")
              }
              dateFormat="dd/MM/yyyy"
              locale={ptBR}
              className="date-input"
              placeholderText="dd/mm/yyyy"
            />
          </div>

          <button
            onClick={applyFilters}
            className="apply-btn"
            disabled={loading}
          >
            {loading ? "Carregando..." : "Aplicar Filtros"}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {filteredData.length === 0 && hasFilters ? (
        <div className="no-data">
          <h3>Nenhum dado encontrado</h3>
          <p>Ajuste os filtros ou clique em "Aplicar Filtros"</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="no-selection">
          <h3>Selecione uma aeronave e período</h3>
          <p>Use os filtros acima e clique em "Aplicar Filtros"</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-big">{stats.totalRecords}</div>
              <div>Registros Filtrados</div>
            </div>
            <div className="stat-card">
              <div className="stat-big">{stats.avgAltitude} ft</div>
              <div>Alt. Média</div>
            </div>
            <div className="stat-card">
              <div className="stat-big">{stats.maxSpeed} kts</div>
              <div>Vel. Máxima</div>
            </div>
            <div className="stat-card">
              <div className="stat-big">{stats.avgEnergy}</div>
              <div>Energia Média</div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="charts-grid">
            <div className="chart-panel">
              <h3>Altitude, Velocidade e Energia vs Tempo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="altitude"
                    name="Altitude (ft)"
                    stroke="#38bdf8"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="speed"
                    name="Speed (kts)"
                    stroke="#10b981"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy"
                    stroke="#f59e0b"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-panel">
              <h3>Distribuição Altitude</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="altitude" fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-panel">
              <h3>Bateria: Saúde e Consumo</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />

                  {/* Nível de energia ao longo do tempo */}
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Nível Energia"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                  />

                  {/* Energia suavizada (média móvel simples para tendência) */}
                  <Line
                    type="monotone"
                    dataKey="energySmooth"
                    name="Tendência Energia"
                    stroke="#eab308"
                    strokeWidth={2}
                    strokeDasharray="4 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
