import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export async function fetchTrackingData(filters = {}) {
  const response = await api.get("/tracking", { params: filters });
  return response.data;
}

export default api;

/**
 * Busca waypoints de uma rota específica
 * @param {string} routeId - UUID da rota
 * @returns {Promise<Array>} Lista de waypoints
 */
export async function fetchWaypoints(routeId) {
  const response = await api.get("/waypoints", { params: { route: routeId } });
  return response.data;
}
