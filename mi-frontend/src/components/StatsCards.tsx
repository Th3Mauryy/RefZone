import React from 'react';

interface StatsCardsProps {
  total: number;
  upcoming: number;
  needsReferee: number;
}

export default function StatsCards({ total, upcoming, needsReferee }: StatsCardsProps): React.ReactElement {
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
