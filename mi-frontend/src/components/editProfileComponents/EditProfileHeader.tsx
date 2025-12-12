import React from 'react';
import { Link } from 'react-router-dom';

interface EditProfileHeaderProps {
  userName?: string;
  userRole?: 'arbitro' | 'organizador';
  calificacionPromedio?: number;
  totalCalificaciones?: number;
  dashboardRoute: string;
}

export const EditProfileHeader: React.FC<EditProfileHeaderProps> = ({
  userName,
  userRole,
  calificacionPromedio = 0,
  totalCalificaciones = 0,
  dashboardRoute,
}) => {
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="stars-container">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="star filled" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="star half" viewBox="0 0 24 24" fill="currentColor">
            <defs>
              <linearGradient id="halfGradient">
                <stop offset="50%" stopColor="currentColor"/>
                <stop offset="50%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#halfGradient)"/>
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className="star empty" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="profile-header">
      <Link to={dashboardRoute} className="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="back-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver al Dashboard
      </Link>
      
      <h1 className="profile-title">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="title-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        Editar Perfil
      </h1>
      
      <div className="user-info">
        <span className="user-name">{userName || 'Usuario'}</span>
        <span className={`user-role ${userRole}`}>
          {userRole === 'organizador' ? '🏟️ Organizador' : '⚽ Árbitro'}
        </span>
      </div>

      {userRole === 'arbitro' && (
        <div className="rating-section">
          {renderStars(calificacionPromedio)}
          <span className="rating-text">
            {calificacionPromedio.toFixed(1)} ({totalCalificaciones} {totalCalificaciones === 1 ? 'calificación' : 'calificaciones'})
          </span>
        </div>
      )}
    </div>
  );
};
