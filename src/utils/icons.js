import L from "leaflet";

const SVG_EVTOL = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36">
  <g fill="none" stroke="#38bdf8" stroke-width="2">
    <circle cx="32" cy="32" r="14" fill="#38bdf8" fill-opacity="0.2"/>
    <polygon points="32,10 26,38 32,34 38,38" fill="#38bdf8" stroke="#38bdf8"/>
    <line x1="20" y1="28" x2="44" y2="28" stroke-width="3"/>
    <circle cx="18" cy="28" r="4" fill="#38bdf8" fill-opacity="0.4"/>
    <circle cx="46" cy="28" r="4" fill="#38bdf8" fill-opacity="0.4"/>
  </g>
</svg>`;

const SVG_DRONE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32">
  <g fill="none" stroke="#a78bfa" stroke-width="2">
    <rect x="26" y="26" width="12" height="12" rx="2" fill="#a78bfa" fill-opacity="0.3"/>
    <line x1="28" y1="28" x2="16" y2="16"/>
    <line x1="36" y1="28" x2="48" y2="16"/>
    <line x1="28" y1="36" x2="16" y2="48"/>
    <line x1="36" y1="36" x2="48" y2="48"/>
    <circle cx="16" cy="16" r="6" fill="#a78bfa" fill-opacity="0.3"/>
    <circle cx="48" cy="16" r="6" fill="#a78bfa" fill-opacity="0.3"/>
    <circle cx="16" cy="48" r="6" fill="#a78bfa" fill-opacity="0.3"/>
    <circle cx="48" cy="48" r="6" fill="#a78bfa" fill-opacity="0.3"/>
  </g>
</svg>`;

const SVG_HELICOPTER = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="36" height="36">
  <g fill="none" stroke="#f59e0b" stroke-width="2">
    <ellipse cx="32" cy="34" rx="10" ry="8" fill="#f59e0b" fill-opacity="0.25"/>
    <line x1="32" y1="26" x2="32" y2="14"/>
    <line x1="14" y1="14" x2="50" y2="14" stroke-width="3"/>
    <line x1="32" y1="42" x2="32" y2="52"/>
    <line x1="22" y1="52" x2="42" y2="52" stroke-width="2"/>
    <line x1="42" y1="34" x2="54" y2="30"/>
  </g>
</svg>`;

const SVG_DEFAULT = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32">
  <g fill="none" stroke="#22d3ee" stroke-width="2">
    <polygon points="32,8 24,42 32,36 40,42" fill="#22d3ee" fill-opacity="0.3" stroke="#22d3ee"/>
    <line x1="18" y1="30" x2="46" y2="30" stroke-width="2.5"/>
    <line x1="26" y1="46" x2="38" y2="46" stroke-width="2"/>
  </g>
</svg>`;

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

const iconCache = {};

export function getAircraftIcon(modelType) {
  const key = modelType || "DEFAULT";
  if (iconCache[key]) return iconCache[key];

  let svg;
  switch (key) {
    case "EVTOL":     svg = SVG_EVTOL; break;
    case "DRONE":     svg = SVG_DRONE; break;
    case "HELICOPTER": svg = SVG_HELICOPTER; break;
    default:          svg = SVG_DEFAULT;
  }

  const icon = L.icon({
    iconUrl: svgToDataUrl(svg),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

  iconCache[key] = icon;
  return icon;
}
