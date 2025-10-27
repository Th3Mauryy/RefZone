// /src/components/StatsCards.jsx
export default function StatsCards({ total, upcoming, needsReferee }) {
  return (
    <section className="stats">
      <div className="stat">
        <span className="stat__label">Total</span>
        <span className="stat__value">{total || 0}</span>
      </div>
      <div className="stat">
        <span className="stat__label">Próximos</span>
        <span className="stat__value">{upcoming || 0}</span>
      </div>
      <div className="stat">
        <span className="stat__label">Sin árbitro</span>
        <span className="stat__value">{needsReferee || 0}</span>
      </div>
    </section>
  );
}
