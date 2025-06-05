// StatsCards.jsx
import React from "react";

const cardStyle = {
  flex: 1,
  margin: "0 10px",
  padding: "24px",
  border: "2px solid #e0e0ff",
  borderRadius: "8px",
  background: "#fff",
  textAlign: "center",
  minWidth: "200px",
};

const highlightedStyle = {
  ...cardStyle,
  border: "2px solid #bcbcff",
  boxShadow: "0 0 0 2px #e0e0ff",
};

const warningStyle = {
  ...cardStyle,
  color: "#ff9800",
};

export default function StatsCards({ total, upcoming, needsReferee }) {
  return (
    <div style={{ display: "flex", gap: "16px", margin: "32px 0" }}>
      <div style={highlightedStyle}>
        <div style={{ fontSize: 12, color: "#888" }}>Partidos totales</div>
        <div style={{ fontSize: 32, fontWeight: 700, margin: "8px 0" }}>{total}</div>
        <div>
          <span role="img" aria-label="calendar">📅</span>
        </div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, color: "#888" }}>Próximos partidos</div>
        <div style={{ fontSize: 32, fontWeight: 700, margin: "8px 0" }}>{upcoming}</div>
        <div>
          <span role="img" aria-label="calendar">📅</span>
        </div>
      </div>
      <div style={warningStyle}>
        <div style={{ fontSize: 12, color: "#888" }}>Sin árbitro asignado</div>
        <div style={{ fontSize: 32, fontWeight: 700, margin: "8px 0" }}>{needsReferee}</div>
        <div>
          <span role="img" aria-label="warning">⚠️</span>
        </div>
      </div>
    </div>
  );
}